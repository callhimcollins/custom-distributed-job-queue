# Distributed Job Queue

A Redis-backed distributed job queue built from scratch in **TypeScript/Node.js**. Includes an interactive visualizer to see the queue architecture in action.

```
Producer ──RPUSH──▶ MAIN QUEUE ◀──BLPOP── Worker ──HSET──▶ Result Store
                         │                                  │
                    retry│ fail                        Redis HASH
                         ▼                                  │
                    DELAYED ◀── promote ──▶ MAIN QUEUE      │
                         │                                  │
                    exhaust                                  │
                         ▼                                  │
                      DLQ ◀──────────────────────────────────┘
```

**Live visualizer:** [https://viz-seven-nu.vercel.app](https://viz-seven-nu.vercel.app)

---

## Features

| Feature | Description |
|---|---|
| **Priority Queues** | 11 priority levels (0-10, default 5). Higher = processed first. Each level is its own Redis list, checked in order via BLPOP. |
| **Delayed/Scheduled Jobs** | Schedule jobs at a future timestamp using Redis sorted sets. Workers promote due jobs back to the main queue. |
| **Automatic Retries** | Configurable retry count (default 3) with exponential backoff (1s, 2s, 4s, 8s... capped at 30s). |
| **Dead Letter Queue** | Jobs that exhaust retries are moved to a DLQ for manual inspection and re-queue. |
| **Built-in Deduplication** | Every job is automatically deduplicated by type + payload hash (MD5) within a 60-second window. Explicit dedup keys supported for longer windows. |
| **Rate Limiting** | Shared rate limiter across all workers using Redis INCR with per-second sliding windows. |
| **Handler Timeouts** | Configurable timeout per job. Hanging handlers are treated as failures and retried. |
| **Graceful Shutdown** | Workers finish their current job before exiting on SIGINT/SIGTERM. |
| **Result Store** | Job outcomes persisted in Redis hashes for later inspection. |

---

## Architecture

### Data Flow

```
queue.add(job) → serialize to JSON → RPUSH to priority list
                     ↓
worker BLPOP from priority list → deserialize → run handler
                     ↓
          ┌── success ──▶ markCompleted → store result
          │
          └── failure ──▶ attempts < maxAttempts?
                           ├─ YES → exponential backoff → ZADD to delayed set → promote later
                           └─ NO  → RPUSH to DLQ → mark failed
```

### Redis Key Layout

| Key Pattern | Type | Purpose |
|---|---|---|
| `queue:<name>:p0` through `p10` | List | One list per priority level |
| `queue:<name>:delayed` | Sorted Set | Jobs waiting for retry (score = due timestamp) |
| `dlq:<name>` | List | Dead Letter Queue — exhausted retries |
| `job:<id>` | Hash | Job result store (id, type, data) |
| `ratelimit:<name>:<second>` | String | Per-second rate limit counter (auto-expires) |
| `dedup:<name>:<key>` | String | Dedup guard with TTL |

### Job Lifecycle

```
queued ──▶ active ──▶ completed
               │
               └──▶ failed ──▶ (retry if attempts < maxAttempts) ──▶ queued
                              └──▶ (exhausted) ──▶ dlq
```

---

## Quick Start

```bash
# 1. Start Redis
docker compose up -d

# 2. Create a queue and start processing
npx tsx src/example.ts
```

### API

```typescript
import { connectRedis } from "./redis.js";
import { Queue } from "./queue.js";

connectRedis();

// Create a queue with rate limiting
const queue = new Queue("email", {
  maxJobsPerSecond: 10,
  handlerTimeout: 5000, // 5s timeout per job
});

// Add a job (default priority 5)
await queue.add("send-email", { to: "user@example.com" });

// Add a high-priority job
await queue.add("send-email", { to: "vip@example.com" }, { priority: 10 });

// Schedule a job for later
await queue.schedule("send-email", { to: "later@example.com" }, new Date("2026-07-01"));

// Process jobs
await queue.process(async (job) => {
  console.log(`Processing ${job.id}`);
  // ... do the work
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await queue.shutdown();
  process.exit(0);
});
```

---

## Project Structure

```
src/
  redis.ts         — Redis connection (singleton via ioredis)
  types.ts         — Job, JobHandler, AddOptions interfaces
  job.ts           — createJob, serializeJob, deserializeJob
  queue.ts         — Queue class (add, schedule, process, pop, retry, DLQ, rate limiting)
  result-store.ts  — Job result persistence in Redis hashes
viz/               — React + TypeScript interactive visualizer
  src/
    components/    — Architecture, Controls, Stats, QueueVisual, Lifecycle, EventLog
    useQueue.ts    — Client-side queue simulation hook
    App.tsx        — Main app with interactive Learn walkthrough
```

---

## Interactive Visualizer

The `viz/` directory is a standalone React + Vite app that demonstrates the queue architecture visually.

**[https://viz-seven-nu.vercel.app](https://viz-seven-nu.vercel.app)**

- Animated SVG architecture diagram
- Interactive buttons to add, process, and fail jobs
- **Learn mode** — a guided walkthrough that shows the full job lifecycle with highlighted paths and explanatory text
- Retry badges on failed jobs, expandable DLQ with retry buttons
- Auto-scrolling event log

```bash
cd viz
npm install
npm run dev     # local dev on :5174
npm run build   # production build
```

---

## Build Plan

| Phase | Feature | Status |
|---|---|---|
| 1 | Project scaffold + Redis client | Done |
| 2 | Job creation, serialization, deserialization | Done |
| 3 | Basic enqueue (RPUSH) + dequeue (BLPOP) | Done |
| 4 | Worker loop with status tracking | Done |
| 5 | Retries + exponential backoff + DLQ | Done |
| 6 | Delayed / scheduled jobs | Done |
| 7 | Idempotency / deduplication | Done |
| 8 | Rate limiting / backpressure | Done |
| 9 | Priority queues | Done |
| 10 | Graceful shutdown + handler timeouts | Done |
| 11 | Interactive visualizer (React + Vite) | Done |

---

## Stack

- **Language:** TypeScript
- **Queue Store:** Redis (via Docker Compose)
- **Redis Client:** ioredis
- **Job IDs:** nanoid
- **Dev Runner:** tsx
- **Visualizer:** React 18 + Vite + TypeScript

---

*Built as a learning project — feature by feature, function by function.*
