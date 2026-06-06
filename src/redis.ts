import { Redis, RedisOptions } from "ioredis";

let client: Redis | null = null;

export function connectRedis(options?: RedisOptions): Redis {
  if (client) return client;

  client = new Redis({
    host: "localhost",
    port: 6379,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      // Exponential backoff: wait 200ms * 2^(times-1), max 5s
      const delay = Math.min(200 * 2 ** (times - 1), 5000);
      return delay;
    },
    ...options,
  });

  client.on("error", (err) => {
    console.error("[redis] connection error:", err.message);
  });

  client.on("connect", () => {
    console.log("[redis] connected");
  });

  return client;
}

export function getRedis(): Redis {
  if (!client) throw new Error("Redis not connected. Call connectRedis() first.");
  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (!client) return;
  await client.quit();
  client = null;
  console.log("[redis] disconnected");
}
