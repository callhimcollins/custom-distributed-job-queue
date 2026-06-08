import { getRedis } from "./redis.js";
import { createJob, serializeJob, deserializeJob } from "./job.js";
import { ResultStore } from "./result-store.js";
import type { Job, JobHandler } from "./types.js";

export class Queue {
  private name: string;
  private results: ResultStore;

  constructor(name: string, results?: ResultStore) {
    this.name = name;
    this.results = results ?? new ResultStore();
  }

  private get queueKey() {
    return `queue:${this.name}`;
  }

  async add<T>(type: string, payload: T): Promise<Job<T>> {
    const redis = getRedis();
    const job = createJob(type, payload);
    const raw = serializeJob(job);
    await redis.rpush(this.queueKey, raw);
    return job;
  }

  async pop<T = unknown>(): Promise<Job<T> | null> {
    const redis = getRedis();
    const result = await redis.blpop(this.queueKey, 0);
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
        await this.results.markFailed(job, message);
        console.error(`[queue] job ${job.id} failed:`, message);
      }
    }
  }
}
