import { prisma } from "server/db";
import { clerkClient as _clerkClient } from "@clerk/nextjs/server";
import { renderOverdueReminderEmail } from "server/emails/OverdueReminderEmail";

export type OverdueReminderResult = {
  count: number;
  emailed: number;
  skipped: number;
  errors: number;
};

export async function sendOverdueReminders(): Promise<OverdueReminderResult> {
  const now = new Date();
  const client: any =
    typeof _clerkClient === "function" ? await (_clerkClient as any)() : (_clerkClient as any);
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
      adherent: { select: { clerkUserId: true, nom: true } },
    },
  });

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddr = process.env.RESEND_FROM ?? "onboarding@resend.dev";
  let resend: any | null = null;
  if (apiKey) {
    const mod = await import("resend");
    resend = new mod.Resend(apiKey);
  } else {
    console.warn("RESEND_API_KEY not set; will log reminders without emailing.");
  }

  let emailed = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of overdue) {
    const days = Math.floor((now.getTime() - p.dateEcheance.getTime()) / (1000 * 60 * 60 * 24));
    const clerkId = p.adherent.clerkUserId;
    try {
      let email: string | undefined;
      if (clerkId) {
        const user = await client.users.getUser(clerkId);
        const primaryId = (user as any).primaryEmailAddressId as string | undefined;
        const primary = user.emailAddresses.find(
          (e: { id: string; emailAddress: string }) => e.id === primaryId
        );
        email = primary?.emailAddress ?? (user.emailAddresses[0] as { emailAddress: string } | undefined)?.emailAddress;
      }

      if (!resend || !email) {
        skipped++;
        console.log(
          `[overdue] (skip email) Pret ${p.id} adherent=${p.adherentId} days=${days} email=${email ?? "n/a"}`
        );
        continue;
      }

      const subject = "Overdue loan reminder";
      const text = `Bonjour ${p.adherent.nom},\n\n` +
        `Votre emprunt (Id: ${p.id}) est en retard de ${days} jour(s). ` +
        `Merci de retourner l'ouvrage ou contacter la bibliothèque.\n\n` +
        `— Bibliothèque`;

      const html = renderOverdueReminderEmail({ name: p.adherent.nom, days, pretId: p.id });

      await resend.emails.send({ from: fromAddr, to: email, subject, text, html });
      emailed++;
    } catch (err) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[overdue] email error for Pret ${p.id}: ${msg}`);
    }
  }

  return { count: overdue.length, emailed, skipped, errors };
}
