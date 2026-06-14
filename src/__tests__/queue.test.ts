import { describe, it, expect, vi, beforeEach } from "vitest";
import { Queue } from "../queue.js";
import type { Redis } from "ioredis";

/**
 * Create a fake Redis object we can pass to Queue via options.
 * Each method is a vitest mock (vi.fn()) so we can spy on calls
 * and control return values — no real Redis needed.
 */
function createMockRedis(): Redis {
  return {
    set: vi.fn(),
    rpush: vi.fn(),
    zadd: vi.fn(),
    zrangebyscore: vi.fn().mockResolvedValue([]),
    zrem: vi.fn(),
    blpop: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    hset: vi.fn(),
    hget: vi.fn(),
    pipeline: vi.fn(() => ({
      rpush: vi.fn(),
      zrem: vi.fn(),
      exec: vi.fn().mockResolvedValue([]),
    })),
  } as unknown as Redis;
}

describe("Queue", () => {
  let redis: Redis;
  let queue: Queue;

  /** Runs before each test — gives us a fresh mock + queue every time */
  beforeEach(() => {
    redis = createMockRedis();
    queue = new Queue("test", { redis });
  });

  describe("add", () => {
    it("pushes a serialized job to the priority list", async () => {
      // Arrange: make dedup succeed (SET NX returns "OK")
      vi.mocked(redis.set).mockResolvedValue("OK");

      // Act
      await queue.add("email", { to: "user@example.com" });

      // Assert: Redis RPUSH was called with the right key
      expect(redis.rpush).toHaveBeenCalledOnce();
      const [key, raw] = vi.mocked(redis.rpush).mock.calls[0];
      expect(key).toBe("queue:test:p5"); // default priority is 5

      // The value should be JSON with our job data
      const job = JSON.parse(raw as string);
      expect(job.type).toBe("email");
      expect(job.payload).toEqual({ to: "user@example.com" });
      expect(job.priority).toBe(5);
      expect(job.attempts).toBe(0);
    });

    it("suppresses duplicates via dedup key", async () => {
      // Arrange: first call succeeds (SET NX returns OK)
      vi.mocked(redis.set).mockResolvedValueOnce("OK");

      // Act: add the same job twice
      await queue.add("email", { to: "user@example.com" });
      await queue.add("email", { to: "user@example.com" });

      // Assert: RPUSH should only be called once (second was deduped)
      expect(redis.rpush).toHaveBeenCalledTimes(1);
    });

    it("respects custom priority levels", async () => {
      vi.mocked(redis.set).mockResolvedValue("OK");

      await queue.add("urgent", { msg: "fire" }, { priority: 10 });

      const [key] = vi.mocked(redis.rpush).mock.calls[0];
      expect(key).toBe("queue:test:p10");
    });
  });

  describe("pop", () => {
    it("returns a deserialized job from BLPOP", async () => {
      // Arrange: simulate BLPOP returning a job from priority 5 list
      const fakeJob = JSON.stringify({
        id: "job-1",
        type: "email",
        payload: { to: "a@b.com" },
        priority: 5,
        status: "queued",
        attempts: 0,
        maxAttempts: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      vi.mocked(redis.blpop).mockResolvedValue(["queue:test:p5", fakeJob]);

      // Act
      const job = await queue.pop();

      // Assert
      expect(job).not.toBeNull();
      expect(job!.type).toBe("email");
      expect(job!.payload).toEqual({ to: "a@b.com" });
    });

    it("returns null when BLPOP times out", async () => {
      vi.mocked(redis.blpop).mockResolvedValue(null);

      const job = await queue.pop();
      expect(job).toBeNull();
    });
  });

  describe("schedule", () => {
    it("adds a job to the delayed sorted set", async () => {
      const future = new Date("2027-01-01");
      await queue.schedule("email", { to: "later@b.com" }, future);

      expect(redis.zadd).toHaveBeenCalledOnce();
      const [key, score] = vi.mocked(redis.zadd).mock.calls[0];
      expect(key).toBe("queue:test:delayed");
      expect(score).toBe(future.getTime());
    });
  });
});
