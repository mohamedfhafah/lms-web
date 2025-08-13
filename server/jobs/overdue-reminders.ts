import { prisma } from "server/db";

export type OverdueReminderResult = {
  count: number;
};

export async function sendOverdueReminders(): Promise<OverdueReminderResult> {
  const now = new Date();
  const overdue = await prisma.pret.findMany({
    where: {
      dateRetourEffective: null,
      dateEcheance: { lt: now },
    },
    select: {
      id: true,
      adherentId: true,
      livreId: true,
      dateEcheance: true,
    },
  });

  // NOTE: Email addresses are not stored in the current schema (no Adherent.email).
  // We just log for now to avoid schema changes (per project rules).
  // In production, integrate Clerk email or extend schema after review.
  for (const p of overdue) {
    const days = Math.floor((now.getTime() - p.dateEcheance.getTime()) / (1000 * 60 * 60 * 24));
    console.log(
      `[overdue] Pret ${p.id} adherent=${p.adherentId} livre=${p.livreId} overdue ${days} day(s)`
    );
  }

  return { count: overdue.length };
}
