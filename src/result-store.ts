import { getRedis } from "./redis.js";
import { serializeJob, deserializeJob } from "./job.js";
import type { Job } from "./types.js";

export class ResultStore {
  async save(job: Job): Promise<void> {
    const redis = getRedis();
    const raw = serializeJob(job);
    await redis.hset(`job:${job.id}`, {
      id: job.id,
      type: job.type,
      data: raw,
    });
  }

  async get<T = unknown>(id: string): Promise<Job<T> | null> {
    const redis = getRedis();
    const raw = await redis.hget(`job:${id}`, "data");
    if (!raw) return null;
    return deserializeJob<T>(raw);
  }

  async markActive<T>(job: Job<T>): Promise<void> {
    job.status = "active";
    job.updatedAt = Date.now();
    await this.save(job);
  }

  async markCompleted<T>(job: Job<T>, result?: unknown): Promise<void> {
    job.status = "completed";
    job.updatedAt = Date.now();
    job.result = result;
    await this.save(job);
  }

  async markFailed<T>(job: Job<T>, error: string): Promise<void> {
    job.status = "failed";
    job.updatedAt = Date.now();
    job.error = error;
    await this.save(job);
  }
}
