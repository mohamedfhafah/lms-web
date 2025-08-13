import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { prisma } from "../db";
import { z } from "zod";

export const loanRouter = router({
  listMy: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    const adherent = await prisma.adherent.findUnique({ where: { clerkUserId: userId } });
    if (!adherent) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Adherent not found" });
    }

    const prets = await prisma.pret.findMany({
      where: { adherentId: adherent.id },
      orderBy: { dateEmprunt: "desc" },
      include: {
        livre: {
          select: {
            id: true,
            numeroExemplaire: true,
            disponible: true,
            oeuvre: { select: { cote: true, titre: true } },
          },
        },
      },
    });

    return prets.map((p) => ({
      id: p.id,
      dateEmprunt: p.dateEmprunt,
      dateEcheance: p.dateEcheance,
      dateRetourEffective: p.dateRetourEffective,
      renouvellements: p.renouvellements,
      livre: {
        id: p.livre.id,
        numeroExemplaire: p.livre.numeroExemplaire,
        disponible: p.livre.disponible,
        oeuvre: p.livre.oeuvre,
      },
    }));
  }),

  create: protectedProcedure
    .input(z.object({ livreId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const adherent = await prisma.adherent.findUnique({ where: { clerkUserId: userId } });
      if (!adherent) throw new TRPCError({ code: "NOT_FOUND", message: "Adherent not found" });

      const now = new Date();
      const addMonth = (d: Date) => {
        const dd = new Date(d);
        dd.setMonth(dd.getMonth() + 1);
        return dd;
      };

      return await prisma.$transaction(async (tx) => {
        const livre = await tx.livre.findUnique({
          where: { id: input.livreId },
          select: { id: true, disponible: true, oeuvreCote: true, oeuvre: { select: { cote: true } } },
        });
        if (!livre) throw new TRPCError({ code: "NOT_FOUND", message: "Copy not found" });
        if (!livre.disponible) throw new TRPCError({ code: "CONFLICT", message: "Copy not available" });

        // Housekeep: expire outdated NOTIFIED reservations
        await tx.reservation.updateMany({
          where: { oeuvreCote: livre.oeuvreCote, status: "NOTIFIED", expiresAt: { lt: now } },
          data: { status: "EXPIRED" },
        });

        // Check reservation head
        const head = await tx.reservation.findFirst({
          where: { oeuvreCote: livre.oeuvreCote, status: { in: ["PENDING", "NOTIFIED"] } },
          orderBy: { createdAt: "asc" },
        });

        if (head) {
          if (head.adherentId !== adherent.id)
            throw new TRPCError({ code: "FORBIDDEN", message: "Reserved for another member" });
          if (head.status !== "NOTIFIED" || !head.expiresAt || head.expiresAt < now)
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Reservation not ready for pickup" });
        }

        const pret = await tx.pret.create({
          data: {
            adherentId: adherent.id,
            livreId: livre.id,
            dateEmprunt: now,
            dateEcheance: addMonth(now),
          },
        });

        await tx.livre.update({ where: { id: livre.id }, data: { disponible: false } });

        if (head) {
          await tx.reservation.update({ where: { id: head.id }, data: { status: "FULFILLED" } });
        }

        return { id: pret.id };
      });
    }),

  renew: protectedProcedure
    .input(z.object({ pretId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const adherent = await prisma.adherent.findUnique({ where: { clerkUserId: userId } });
      if (!adherent) throw new TRPCError({ code: "NOT_FOUND", message: "Adherent not found" });

      const addMonth = (d: Date) => {
        const dd = new Date(d);
        dd.setMonth(dd.getMonth() + 1);
        return dd;
      };

      return await prisma.$transaction(async (tx) => {
        const pret = await tx.pret.findUnique({
          where: { id: input.pretId },
          include: { livre: { select: { oeuvreCote: true } } },
        });
        if (!pret || pret.adherentId !== adherent.id)
          throw new TRPCError({ code: "NOT_FOUND", message: "Loan not found" });
        if (pret.dateRetourEffective)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Loan already returned" });

        const now = new Date();
        // Housekeep reservations
        await tx.reservation.updateMany({
          where: { oeuvreCote: pret.livre.oeuvreCote, status: "NOTIFIED", expiresAt: { lt: now } },
          data: { status: "EXPIRED" },
        });

        // Deny renewal if any active reservation exists (others waiting)
        const active = await tx.reservation.findFirst({
          where: {
            oeuvreCote: pret.livre.oeuvreCote,
            status: { in: ["PENDING", "NOTIFIED"] },
            // allow if the only head is the same adherent and notified? Typically renewal should be blocked if anyone waiting
          },
        });
        if (active) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Reservation queue exists" });

        const updated = await tx.pret.update({
          where: { id: pret.id },
          data: { dateEcheance: addMonth(pret.dateEcheance), renouvellements: { increment: 1 } },
        });
        return { id: updated.id, dateEcheance: updated.dateEcheance, renouvellements: updated.renouvellements };
      });
    }),

  return: protectedProcedure
    .input(z.object({ pretId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const adherent = await prisma.adherent.findUnique({ where: { clerkUserId: userId } });
      if (!adherent) throw new TRPCError({ code: "NOT_FOUND", message: "Adherent not found" });

      return await prisma.$transaction(async (tx) => {
        const pret = await tx.pret.findUnique({
          where: { id: input.pretId },
          include: { livre: { select: { id: true, oeuvreCote: true } } },
        });
        if (!pret) throw new TRPCError({ code: "NOT_FOUND", message: "Loan not found" });
        if (pret.adherentId !== adherent.id)
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot return a loan you don't own" });
        if (pret.dateRetourEffective)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Loan already returned" });

        const now = new Date();
        await tx.pret.update({ where: { id: pret.id }, data: { dateRetourEffective: now } });
        await tx.livre.update({ where: { id: pret.livre.id }, data: { disponible: true } });

        // Housekeep reservations
        await tx.reservation.updateMany({
          where: { oeuvreCote: pret.livre.oeuvreCote, status: "NOTIFIED", expiresAt: { lt: now } },
          data: { status: "EXPIRED" },
        });

        // Notify next in queue
        const next = await tx.reservation.findFirst({
          where: { oeuvreCote: pret.livre.oeuvreCote, status: "PENDING" },
          orderBy: { createdAt: "asc" },
        });
        if (next) {
          const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          await tx.reservation.update({
            where: { id: next.id },
            data: { status: "NOTIFIED", notifiedAt: now, expiresAt },
          });
        }

        return { ok: true };
      });
    }),
});
