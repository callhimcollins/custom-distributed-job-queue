export type JobColor = "blue" | "pink" | "yellow" | "lime" | "orange";
export type JobStatus = "queued" | "active" | "completed" | "delayed" | "dlq";
export interface Job {
  id: string; type: string; color: JobColor; attempts: number; maxAttempts: number;
  status: JobStatus; promoted?: boolean; scheduledAt?: number;
}
