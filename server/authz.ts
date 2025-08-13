import { TRPCError } from "@trpc/server";
import { prisma } from "./db";
import { $Enums } from "@/generated/prisma";

export async function requireRole(ctx: { auth: { userId: string | null } }, role: $Enums.Role) {
  const userId = ctx.auth.userId;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const adherent = await prisma.adherent.findUnique({ where: { clerkUserId: userId } });
  if (!adherent || adherent.role !== role) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
  }
  return adherent;
}

export async function requireLibrarian(ctx: { auth: { userId: string | null } }) {
  return requireRole(ctx, $Enums.Role.LIBRARIAN);
}
