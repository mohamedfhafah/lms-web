import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "server/routers/_app";
import { createTRPCContext } from "server/trpc";
import { auth } from "@clerk/nextjs/server";

const handler = async (req: Request) => {
  const { userId } = await auth();
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req, auth: { userId: userId ?? null } }),
  });
};

export { handler as GET, handler as POST };
