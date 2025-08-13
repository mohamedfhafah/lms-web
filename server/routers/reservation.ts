import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { prisma } from "../db";
import { z } from "zod";

export const reservationRouter = router({
  listMy: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    const adherent = await prisma.adherent.findUnique({ where: { clerkUserId: userId } });
    if (!adherent) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Adherent not found" });
    }

    const reservations = await prisma.reservation.findMany({
      where: { adherentId: adherent.id },
      orderBy: { createdAt: "desc" },
      include: {
        oeuvre: { select: { cote: true, titre: true } },
      },
    });

    return reservations.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      notifiedAt: r.notifiedAt,
      expiresAt: r.expiresAt,
      oeuvre: r.oeuvre,
    }));
  }),

  create: protectedProcedure
    .input(z.object({ oeuvreCote: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const adherent = await prisma.adherent.findUnique({ where: { clerkUserId: userId } });
      if (!adherent) throw new TRPCError({ code: "NOT_FOUND", message: "Adherent not found" });

      return await prisma.$transaction(async (tx) => {
        const oeuvre = await tx.oeuvre.findUnique({ where: { cote: input.oeuvreCote } });
        if (!oeuvre) throw new TRPCError({ code: "NOT_FOUND", message: "Work not found" });

        const dup = await tx.reservation.findFirst({
          where: {
            adherentId: adherent.id,
            oeuvreCote: input.oeuvreCote,
            status: { in: ["PENDING", "NOTIFIED"] },
          },
        });
        if (dup) throw new TRPCError({ code: "CONFLICT", message: "Active reservation exists" });

        const available = await tx.livre.count({
          where: { oeuvreCote: input.oeuvreCote, disponible: true },
        });
        if (available > 0) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Copies available; borrow instead" });
        }

        const res = await tx.reservation.create({
          data: {
            adherentId: adherent.id,
            oeuvreCote: input.oeuvreCote,
            status: "PENDING",
          },
        });
        return { id: res.id };
      });
    }),

  cancel: protectedProcedure
    .input(z.object({ reservationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const adherent = await prisma.adherent.findUnique({ where: { clerkUserId: userId } });
      if (!adherent) throw new TRPCError({ code: "NOT_FOUND", message: "Adherent not found" });

      return await prisma.$transaction(async (tx) => {
        const res = await tx.reservation.findUnique({ where: { id: input.reservationId } });
        if (!res) throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
        if (res.adherentId !== adherent.id)
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot cancel another user's reservation" });
        if (res.status === "FULFILLED" || res.status === "CANCELLED" || res.status === "EXPIRED")
          throw new TRPCError({ code: "BAD_REQUEST", message: "Reservation already finalized" });

        // Cancel it
        await tx.reservation.update({ where: { id: res.id }, data: { status: "CANCELLED" } });

        // If it was notified, promote next if a copy is currently available
        if (res.status === "NOTIFIED") {
          const available = await tx.livre.count({ where: { oeuvreCote: res.oeuvreCote, disponible: true } });
          if (available > 0) {
            const next = await tx.reservation.findFirst({
              where: { oeuvreCote: res.oeuvreCote, status: "PENDING" },
              orderBy: { createdAt: "asc" },
            });
            if (next) {
              const now = new Date();
              const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              await tx.reservation.update({
                where: { id: next.id },
                data: { status: "NOTIFIED", notifiedAt: now, expiresAt },
              });
            }
          }
        }

        return { ok: true };
      });
    }),
});
