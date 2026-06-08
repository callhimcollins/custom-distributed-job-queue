import { getRedis } from "./redis.js";
import { createJob, serializeJob, deserializeJob } from "./job.js";
import type { Job, JobHandler } from "./types.js";

export class Queue {
  private name: string;

  constructor(name: string) {
    this.name = name;
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
    return deserializeJob<T>(raw);
  }

  async process<T = unknown>(handler: JobHandler<T>): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const job = await this.pop<T>();
      if (!job) continue;

      try {
        await handler(job);
        console.log(`[queue] job ${job.id} completed`);
      } catch (err) {
        console.error(`[queue] job ${job.id} failed:`, err);
      }
    }
  }
}
