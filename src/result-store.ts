import { getRedis } from "./redis.js";
import { serializeJob, deserializeJob } from "./job.js";
import type { Redis } from "ioredis";
import type { Job } from "./types.js";

export class ResultStore {
  private redis: Redis;

  constructor(options?: { redis?: Redis }) {
    this.redis = options?.redis ?? getRedis();
  }

  async save(job: Job): Promise<void> {
    const raw = serializeJob(job);
    await this.redis.hset(`job:${job.id}`, {
      id: job.id,
      type: job.type,
      data: raw,
    });
  }

  async get<T = unknown>(id: string): Promise<Job<T> | null> {
    const raw = await this.redis.hget(`job:${id}`, "data");
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
