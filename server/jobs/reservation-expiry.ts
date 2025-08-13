import { prisma } from "server/db";
import { $Enums } from "@prisma/client";

export async function expireNotifiedReservations() {
  const now = new Date();
  const result = await prisma.reservation.updateMany({
    where: {
      status: $Enums.ReservationStatus.NOTIFIED,
      expiresAt: { lt: now },
    },
    data: { status: $Enums.ReservationStatus.EXPIRED },
  });
  console.log(`Expired ${result.count} reservations.`);
  return { count: result.count };
}
