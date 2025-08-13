import { router, protectedProcedure } from "../trpc";
import { prisma } from "../db";
import { requireLibrarian } from "../authz";

export const adminRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    await requireLibrarian(ctx);

    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [overdueLoans, expiringReservations] = await Promise.all([
      prisma.pret.findMany({
        where: {
          dateRetourEffective: null,
          dateEcheance: { lt: now },
        },
        orderBy: { dateEcheance: "asc" },
        include: {
          adherent: { select: { id: true, nom: true } },
          livre: {
            select: {
              id: true,
              numeroExemplaire: true,
              oeuvre: { select: { cote: true, titre: true } },
            },
          },
        },
      }),
      prisma.reservation.findMany({
        where: {
          expiresAt: { gte: now, lte: in7 },
        },
        orderBy: { expiresAt: "asc" },
        include: {
          adherent: { select: { id: true, nom: true } },
          oeuvre: { select: { cote: true, titre: true } },
        },
      }),
    ]);

    return {
      overdueLoans: overdueLoans.map((p: typeof overdueLoans[number]) => ({
        id: p.id,
        adherent: p.adherent,
        dateEcheance: p.dateEcheance,
        livre: p.livre,
      })),
      expiringReservations: expiringReservations.map((r: typeof expiringReservations[number]) => ({
        id: r.id,
        adherent: r.adherent,
        expiresAt: r.expiresAt,
        oeuvre: r.oeuvre,
        status: r.status,
      })),
    };
  }),
});
