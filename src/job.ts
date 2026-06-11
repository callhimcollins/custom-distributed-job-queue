import { nanoid } from "nanoid";
import type { Job } from "./types.js";

export interface CreateJobOptions {
  id?: string;
  attempts?: number;
  maxAttempts?: number;
  priority?: number;
}

export function createJob<T>(
  type: string,
  payload: T,
  options?: CreateJobOptions
): Job<T> {
  const now = Date.now();

  return {
    id: options?.id ?? nanoid(),
    type,
    payload,
    status: "queued",
    attempts: options?.attempts ?? 0,
    maxAttempts: options?.maxAttempts ?? 3,
    priority: options?.priority ?? 5,
    createdAt: now,
    updatedAt: now,
  };
}

export function serializeJob(job: Job): string {
  return JSON.stringify(job);
}

export function deserializeJob<T = unknown>(raw: string): Job<T> {
  return JSON.parse(raw) as Job<T>;
}
