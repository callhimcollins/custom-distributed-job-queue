import { createHash } from "node:crypto";
import { getRedis } from "./redis.js";
import { createJob, serializeJob, deserializeJob } from "./job.js";
import { ResultStore } from "./result-store.js";
import type { Job, JobHandler, AddOptions } from "./types.js";

export class Queue {
  private name: string;
  private results: ResultStore;
  private maxPerSecond?: number;

  constructor(name: string, options?: { results?: ResultStore; maxJobsPerSecond?: number }) {
    this.name = name;
    this.results = options?.results ?? new ResultStore();
    this.maxPerSecond = options?.maxJobsPerSecond;
  }

  private get queueKey() {
    return `queue:${this.name}`;
  }

  /** Sorted set: score = timestamp when the job is eligible to be retried */
  private get delayedKey() {
    return `queue:${this.name}:delayed`;
  }

  /** Simple list — jobs that exhausted their retries */
  private get dlqKey() {
    return `dlq:${this.name}`;
  }

  /** Redis key for a given priority level */
  private priorityKey(level: number): string {
    return `${this.queueKey}:p${level}`;
  }




  async add<T>(type: string, payload: T, options?: AddOptions): Promise<Job<T>> {
    const redis = getRedis();
    const job = createJob(type, payload, { priority: options?.priority });
    const raw = serializeJob(job);

    // Derive dedup key: explicit key wins, otherwise auto-hash type + payload
    const dedupKey = options?.dedupKey ?? autoDedupKey(type, payload);
    const dedupRedisKey = `dedup:${this.name}:${dedupKey}`;
    const ttl = options?.dedupTTL ?? 60;
    const inserted = await redis.set(dedupRedisKey, job.id, "EX", ttl, "NX");
    if (inserted !== "OK") {
      console.log(`[queue] duplicate suppressed (dedup key: ${dedupKey})`);
      return job;
    }

    await redis.rpush(this.priorityKey(job.priority), raw);
    return job;
  }




  /** Schedule a job to run at a specific future time */
  async schedule<T>(type: string, payload: T, when: Date, options?: { priority?: number }): Promise<Job<T>> {
    const job = createJob(type, payload, { priority: options?.priority });
    job.scheduledAt = when.getTime();
    const raw = serializeJob(job);
    const redis = getRedis();
    await redis.zadd(this.delayedKey, job.scheduledAt, raw);
    return job;
  }




  /** Move due delayed jobs back into the main queue. sCalled before each BLPOP. */
  private async promoteDelayed(): Promise<number> {
    const redis = getRedis();
    const now = Date.now();
    const jobs = await redis.zrangebyscore(this.delayedKey, 0, now);
    if (jobs.length === 0) return 0;

    const pipeline = redis.pipeline();
    for (const raw of jobs) {
      const parsed = JSON.parse(raw) as Job;
      pipeline.rpush(this.priorityKey(parsed.priority), raw);
      pipeline.zrem(this.delayedKey, raw);
    }
    await pipeline.exec();
    return jobs.length;
  }




  private async retryJob<T>(job: Job<T>, error: string): Promise<void> {
    job.attempts += 1;
    job.status = "queued";
    job.error = error;
    job.updatedAt = Date.now();

    if (job.attempts >= job.maxAttempts) {
      // Exhausted — send to dead letter queue
      await this.results.markFailed(job, error);
      const redis = getRedis();
      await redis.rpush(this.dlqKey, serializeJob(job));
      console.warn(`[queue] job ${job.id} sent to DLQ after ${job.attempts} attempts`);
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s... capped at 30s
    const delay = Math.min(1000 * 2 ** (job.attempts - 1), 30000);
    job.scheduledAt = Date.now() + delay;

    await this.results.save(job);
    const redis = getRedis();
    await redis.zadd(this.delayedKey, job.scheduledAt, serializeJob(job));
    console.log(`[queue] job ${job.id} will retry in ${delay}ms (attempt ${job.attempts}/${job.maxAttempts})`);
  }




  /** Wait until we're under the rate limit (if configured) */
  private async checkRateLimit(): Promise<void> {
    if (!this.maxPerSecond) return;

    const redis = getRedis();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const now = Date.now();
      const windowKey = Math.floor(now / 1000);
      const key = `ratelimit:${this.name}:${windowKey}`;

      const count = await redis.incr(key);
      if (count === 1) {
        // First request in this 1s window — set expiry so the key auto-cleans
        await redis.expire(key, 2);
      }

      if (count <= this.maxPerSecond) return; // under limit, proceed

      // Over limit — wait until next second + random jitter to spread workers
      const nextSecond = (windowKey + 1) * 1000;
      const jitter = Math.random() * 50;
      const waitMs = nextSecond - now + jitter;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      // Loop back and retry with the new window
    }
  }




  async pop<T = unknown>(): Promise<Job<T> | null> {
    const redis = getRedis();

    // Promote any delayed jobs that are now due
    await this.promoteDelayed();

    // Wait if we're hitting the rate limit
    await this.checkRateLimit();

    // Check priority levels 10 (highest) down to 0 (lowest)
    const priorityKeys = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((p) => this.priorityKey(p));
    const result = await redis.blpop(priorityKeys, 2);
    if (!result) return null;
    const [, raw] = result;
    const job = deserializeJob<T>(raw);
    await this.results.markActive(job);
    return job;
  }




  async process<T = unknown>(handler: JobHandler<T>): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const job = await this.pop<T>();
      if (!job) continue;

      try {
        const result = await handler(job);
        await this.results.markCompleted(job, result);
        console.log(`[queue] job ${job.id} completed`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await this.retryJob(job, message);
      }
    }
  }
}




/** Auto-derive a dedup key from job type + payload for burst-duplicate protection */
function autoDedupKey(type: string, payload: unknown): string {
  const hash = createHash("md5")
    .update(type + JSON.stringify(payload))
    .digest("hex");
  return `auto:${hash}`;
}
