import { Worker } from "bullmq";
import { redis } from "server/redis";
import { sendOverdueReminders } from "./overdue-reminders";

declare const globalThis: typeof global & {
  __overdueRemindersWorker?: Worker;
};

const enableBullWorker = process.env.ENABLE_BULL_WORKER !== "false";

if (redis && enableBullWorker) {
  if (!globalThis.__overdueRemindersWorker) {
    globalThis.__overdueRemindersWorker = new Worker(
      "overdue-reminders",
      async () => {
        const res = await sendOverdueReminders();
        console.log(`Overdue reminders processed: ${res.count} loans.`);
        return res;
      },
      { connection: redis }
    );
    console.log("Overdue reminders worker started.");
  }
} else {
  if (!redis) console.warn("Redis not configured, overdue reminders worker not started.");
  if (!enableBullWorker) console.warn("ENABLE_BULL_WORKER=false, overdue reminders worker not started.");
}
