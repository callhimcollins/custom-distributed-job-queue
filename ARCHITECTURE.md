# Architecture

## Redis Keys

| Key Pattern | Type | Purpose |
|---|---|---|
| `queue:<name>:p<N>` | List | Main queue per priority level (0-10) |
| `queue:<name>:delayed` | Sorted Set | Jobs waiting for retry backoff |
| `dlq:<name>` | List | Dead Letter Queue — exhausted retries |
| `dedup:<name>:<key>` | String (with TTL) | Deduplication guard |
| `ratelimit:<name>:<second>` | String (counter, with TTL) | Rate limit window counter |
| `job:<id>` | Hash | Job result store |

## Data Flow

```
                    ┌──────────────────────────────────────────────────┐
                    │                  PRODUCERS                       │
                    │  queue.add("email", data, { priority: 7 })       │
                    └────────────────────┬─────────────────────────────┘
                                         │
                                         ▼
              ┌──────────────────────────────────────────┐
              │           STEP 1: DEDUP CHECK            │
              │                                          │
              │  SET dedup:email:auto:<md5hash> jobId     │
              │      NX EX 60                             │
              │                                          │
              │  Result: "OK"    → new job, continue     │
              │  Result: null    → duplicate, return job │
              └────────────────────┬─────────────────────┘
                                   │ (not a duplicate)
                                   ▼
              ┌──────────────────────────────────────────┐
              │      STEP 2: ENQUEUE TO PRIORITY LIST     │
              │                                          │
              │  RPUSH queue:email:p7  <job JSON>        │
              │                                          │
              │  Worker has NO IDEA this job exists yet  │
              └──────────────────────────────────────────┘
```

## Worker Loop

```
                         WORKER (1 process)

     ┌─────────────────────────────────────────────────┐
     │              process(handler) loop               │
     │                                                  │
     │  while (true):                                   │
     │    ┌─────────────────────────────────────────┐   │
     │    │  pop()                                  │   │
     │    │    │                                     │   │
     │    │    ├─ promoteDelayed()                   │   │
     │    │    │   → ZRANGEBYSCORE delayed 0 <now>   │   │
     │    │    │   → RPUSH each to correct priority   │   │
     │    │    │     list + ZREM from delayed         │   │
     │    │    │                                     │   │
     │    │    ├─ checkRateLimit()                   │   │
     │    │    │   → INCR ratelimit:email:<sec>      │   │
     │    │    │   → over limit? sleep, retry        │   │
     │    │    │                                     │   │
     │    │    └─ BLPOP (11 keys in order):          │   │
     │    │         queue:email:p10  ─┐               │   │
     │    │         queue:email:p9    │               │   │
     │    │         queue:email:p8    │ Check in     │   │
     │    │         queue:email:p7    │ this order   │   │
     │    │         queue:email:p6    │               │   │
     │    │         queue:email:p5  ←─┤ ← job here  │   │
     │    │         queue:email:p4    │               │   │
     │    │         queue:email:p3    │               │   │
     │    │         queue:email:p2    │               │   │
     │    │         queue:email:p1    │               │   │
     │    │         queue:email:p0  ──┘               │   │
     │    │                              timeout: 2s  │   │
     │    │                                     │     │   │
     │    └───────── job returned ──────────────┘     │   │
     │              │                                  │   │
     │    ┌─────────▼──────────┐                       │   │
     │    │  handler(job)      │                       │   │
     │    │    │                │                       │   │
     │    │    ├─ SUCCESS ── markCompleted(job)        │   │
     │    │    │              HSET job:abc123 data     │   │
     │    │    │                                       │   │
     │    │    └─ ERROR ── retryJob(job, error)        │   │
     │    │                 attempts += 1              │   │
     │    │                 ├─ exhausted? RPUSH to DLQ │   │
     │    │                 └─ retry left?             │   │
     │    │                     delay = 1s/2s/4s/8s   │   │
     │    │                     ZADD to delayed set    │   │
     │    │                     HSET job:abc123 data   │   │
     │    └─────────────────────────────────────────┘   │
     └─────────────────────────────────────────────────┘
```

## Multiple Workers

```
                    ┌──────────────────────┐
                    │     REDIS             │
                    │                      │
                    │  queue:email:p7     │
                    │  [jobA, jobD, jobE]  │
                    │                      │
                    │  queue:email:p5     │
                    │  [jobB, jobC]        │
                    └────┬────┬────┬───────┘
                         │    │    │
              ┌──────────┘    │    └──────────┐
              ▼               ▼               ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │  Worker 1    │ │  Worker 2    │ │  Worker 3    │
      │              │ │              │ │              │
      │  BLPOP(p7,   │ │  BLPOP(p7,   │ │  BLPOP(p7,   │
      │    p5, ...)  │ │    p5, ...)  │ │    p5, ...)  │
      │              │ │              │ │              │
      │  ← pops jobA │ │  ← pops jobD │ │  ← pops jobE │
      │  from p7     │ │  from p7     │ │  from p7     │
      │              │ │              │ │              │
      │  p7 now:     │ │  p7 now:     │ │  p7 now:     │
      │  [jobD, jobE]│ │  [jobE]      │ │  []          │
      │              │ │              │ │              │
      │  next pop →  │ │  next pop →  │ │  next pop →  │
      │  p7 empty    │ │  p7 empty    │ │  p7 empty    │
      │  checks p5 → │ │  checks p5 → │ │  checks p5 → │
      │  pops jobB   │ │  pops jobC   │ │  empty       │
      │              │ │              │ │  waits 2s    │
      └──────────────┘ └──────────────┘ └──────────────┘
```

## Job Lifecycle

```
queue.add("email", data, { priority: 7 })
  │
  ▼
RPUSH queue:email:p7
  │
  ▼  (worker pops it)
status: "queued" → "active"
  │
  ├── HANDLER SUCCEEDS ──────────────────────────┐
  │   status: "completed"                        │
  │   HSET job:abc123 → done                     │
  │                                              │
  └── HANDLER FAILS ─────────────────────────────┤
      attempts=1, maxAttempts=3                  │
      delay = 1000 * 2^0 = 1s                    │
      ZADD queue:email:delayed (score=now+1s)    │
      status: "queued"                           │
            │                                    │
            ▼   (1s later, promoteDelayed)        │
      RPUSH queue:email:p7 (same priority)       │
            │                                    │
            ▼  (worker pops it again)             │
      status: "queued" → "active"                │
            │                                    │
      ├── HANDLER SUCCEEDS → done                │
      │                                          │
      └── HANDLER FAILS ─────────────────────────┤
          attempts=2                             │
          delay = 2000 * 2^1 = 2s                │
          ZADD delayed with new score            │
                │                                │
                ▼  (2s later)                    │
          BACK TO p7 → handler runs              │
                │                                │
          ├── SUCCESS → done                     │
          │                                      │
          └── FAILS (attempts=3=maxAttempts)     │
               │                                 │
               ▼                                 │
          status: "failed"                       │
          RPUSH dlq:email → DEAD LETTER          │
          HSET job:abc123 status=failed          │
          ☠ NEVER PROCESSED AGAIN                │
```

## `[ , raw]` Destructuring in pop()

```ts
const result = await redis.blpop(priorityKeys, 2);
if (!result) return null;
const [, raw] = result;
```

When `BLPOP` returns data, it returns a 2-element array: `[key, value]`.

- `result[0]` = the key that had data (e.g., `"queue:email:p7"`)
- `result[1]` = the popped element (the job JSON string)

`const [, raw] = result` skips the key (unused) and binds only the job JSON to `raw`.
