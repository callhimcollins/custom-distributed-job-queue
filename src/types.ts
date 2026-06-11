export type JobStatus = "queued" | "active" | "completed" | "failed";

export interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  updatedAt: number;
  scheduledAt?: number;
  result?: unknown;
  error?: string;
}

export type JobHandler<T = unknown> = (job: Job<T>) => Promise<void> | void;

export interface AddOptions {
  /** Unique key for deduplication — if a job with this key was already added, the new one is silently skipped */
  dedupKey?: string;
  /** TTL for the dedup entry in seconds (default: 86400 = 24h) */
  dedupTTL?: number;
}
