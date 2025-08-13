import Redis from "ioredis";

const redisUrl = process.env.UPSTASH_REDIS_URL;
const enableBullWorker = process.env.ENABLE_BULL_WORKER !== "false";

if (!redisUrl) {
  console.warn("UPSTASH_REDIS_URL is not set. Background jobs are disabled.");
}

if (redisUrl && !enableBullWorker) {
  console.warn("ENABLE_BULL_WORKER=false. Redis client disabled.");
}

export const redis = redisUrl && enableBullWorker
  ? new Redis(redisUrl, {
      // Required by BullMQ for blocking commands
      maxRetriesPerRequest: null,
      // Upstash does not support INFO/ready checks
      enableReadyCheck: false,
    })
  : null;

redis?.on("error", (err) => {
  console.error("[redis] error", err);
});
