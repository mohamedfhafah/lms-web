import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "server/db";
import { $Enums } from "@/generated/prisma";
import { Webhook } from "svix";

// Minimal Clerk event schema
const ClerkEmail = z.object({ id: z.string(), email_address: z.string().email() });
const ClerkUser = z.object({
  id: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email_addresses: z.array(ClerkEmail),
  primary_email_address_id: z.string().nullable().optional(),
  public_metadata: z.record(z.string(), z.unknown()).optional(),
});

const ClerkEvent = z.object({
  type: z.string(),
  data: ClerkUser,
});

function normalizeRole(input: unknown): $Enums.Role {
  const val = typeof input === "string" ? input.toUpperCase() : "";
  return val === "LIBRARIAN" ? $Enums.Role.LIBRARIAN : $Enums.Role.ADHERENT;
}

export async function POST(req: Request) {
  try {
    // Verify Svix signature if configured
    const payload = await req.text();
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");
    const secret = process.env.CLERK_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;

    let body: unknown;
    if (secret && svixId && svixTimestamp && svixSignature) {
      try {
        const wh = new Webhook(secret);
        body = wh.verify(payload, {
          "svix-id": svixId,
          "svix-timestamp": svixTimestamp,
          "svix-signature": svixSignature,
        });
      } catch {
        return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
      }
    } else {
      // Fallback: accept unsigned in dev if secret missing
      body = JSON.parse(payload || "{}");
    }

    const parsed = ClerkEvent.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const evt = parsed.data;
    const u = evt.data;

    const primary = u.email_addresses.find((e) => e.id === u.primary_email_address_id) ?? u.email_addresses[0];
    const email = primary?.email_address ?? null;
    const fullName = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || email?.split("@")[0] || "Adherent";
    const role = normalizeRole(u.public_metadata?.role);

    if (!email) {
      return NextResponse.json({ error: "missing email" }, { status: 422 });
    }

    await prisma.adherent.upsert({
      where: { clerkUserId: u.id },
      update: { nom: fullName, role },
      create: {
        clerkUserId: u.id,
        nom: fullName,
        adresse: "",
        dateAdhesion: new Date(),
        role,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
