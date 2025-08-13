import { initTRPC } from "@trpc/server";
import type { inferAsyncReturnType } from "@trpc/server";
import { prisma } from "./db";
import { TRPCError } from "@trpc/server";

export const createTRPCContext = async (opts: { req: Request; auth?: { userId: string | null } }) => {
  return { prisma, req: opts.req, auth: opts.auth };
};

export type Context = inferAsyncReturnType<typeof createTRPCContext>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const mergeRouters = t.mergeRouters;
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.auth?.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      auth: { userId: ctx.auth.userId },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export { t };
