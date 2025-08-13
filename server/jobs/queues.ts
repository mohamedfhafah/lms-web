import { Queue } from "bullmq";
import { redis } from "server/redis";

const enableBullWorker = process.env.ENABLE_BULL_WORKER !== "false";

export const reservationExpiryQueue = redis && enableBullWorker
  ? new Queue("reservation-expiry", { connection: redis })
  : null;
