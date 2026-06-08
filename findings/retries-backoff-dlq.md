# Retries + Backoff + DLQ

## `retryJob()` — the decider

When a handler throws:
1. **Increment attempts** — `job.attempts += 1`
2. **Check budget** — `attempts >= maxAttempts`?
   - If yes → RPUSH to `dlq:{name}` (dead letter queue). The job is dead.
   - If no → calculate backoff delay, set `scheduledAt`, push to delayed sorted set
3. **ResultStore gets the final state** either way — so the dashboard can always find it

## Exponential backoff

```
delay = Math.min(1000 * 2 ** (attempts - 1), 30000)
```

| Attempt | Delay | Total elapsed |
|---------|-------|---------------|
| 1st retry (attempts=1) | 1s | 1s |
| 2nd retry (attempts=2) | 2s | 3s |
| 3rd retry (attempts=3) | 4s | 7s |
| 4th retry (attempts=4) | 8s | 15s |
| 5th retry (attempts=5) | 16s | 31s |
| 6th retry (attempts=6) | 30s (capped) | 61s |

The 30s cap stops the delay from growing forever. With `maxAttempts: 3` (the default), the job retries at +1s and +2s after the first failure, then dies.

## Why a delayed sorted set instead of re-pushing to the main queue?

If we RPUSH retry jobs directly to the main queue, the worker immediately pops it again — it's retrying as fast as possible, ignoring the backoff. We need to **park the job until it's time**.

A **Redis sorted set** (`ZADD` / `ZRANGEBYSCORE`) solves this:

    queue:emails:delayed
      score=1718005000123  →  "job{...}"  (retry at exactly this timestamp)
      score=1718005002123  →  "job{...}"  (retry later)

- `ZADD` inserts with a score (timestamp).
- `ZRANGEBYSCORE ... 0 {now}` returns all jobs whose score ≤ current time — i.e., jobs whose wait is over.
- `promoteDelayed()` moves them to the main list right before `BLPOP`.

This means:
- Backoffs are accurate (the job isn't touchable until its timestamp)
- No timers or polling loops — `promoteDelayed()` runs right before each BLPOP
- Works across multiple distributed workers (any worker can promote)

## DLQ — `dlq:{name}`

A simple Redis list. When maxAttempts is hit, the serialized job gets RPUSHed here. A human (or a separate script) can inspect it with `LRANGE dlq:emails 0 -1`, figure out what went wrong, and manually re-enqueue if needed.
