import { publicProcedure, router } from "../trpc";

export const healthRouter = router({
  ping: publicProcedure.query(async ({ ctx }) => {
    // Light DB check
    await ctx.prisma.$queryRaw`SELECT 1`;
    return { ok: true, time: new Date().toISOString() };
  }),
});
