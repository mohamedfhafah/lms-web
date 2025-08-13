import { protectedProcedure, router } from "../trpc";

export const adherentRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    return ctx.prisma.adherent.findUnique({ where: { clerkUserId: userId } });
  }),
});
