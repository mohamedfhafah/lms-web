import { Worker } from "bullmq";
import { redis } from "server/redis";
import { prisma } from "server/db";
import { $Enums } from "@prisma/client";

declare const globalThis: typeof global & {
  __reservationExpiryWorker?: Worker;
};

const enableBullWorker = process.env.ENABLE_BULL_WORKER !== "false";

if (redis && enableBullWorker) {
  if (!globalThis.__reservationExpiryWorker) {
    globalThis.__reservationExpiryWorker = new Worker(
      "reservation-expiry",
      async () => {
        const now = new Date();
        const result = await prisma.reservation.updateMany({
          where: { status: $Enums.ReservationStatus.NOTIFIED, expiresAt: { lt: now } },
          data: { status: $Enums.ReservationStatus.EXPIRED },
        });
        console.log(`Expired ${result.count} reservations.`);
        return { count: result.count };
      },
      { connection: redis }
    );
    console.log("Reservation expiry worker started.");
  }
} else {
  const reason = !redis
    ? "Redis not configured"
    : "ENABLE_BULL_WORKER=false";
  console.warn(`${reason}, reservation expiry worker not started.`);
}
