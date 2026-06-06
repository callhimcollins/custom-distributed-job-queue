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
  result?: unknown;
  error?: string;
}

export type JobHandler<T = unknown> = (job: Job<T>) => Promise<void> | void;
