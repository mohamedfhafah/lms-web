import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/health",
  "/api/webhooks/(.*)",
  "/api/jobs/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  // tRPC health check
  "/api/trpc/health.ping",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn({ returnBackUrl: req.url });
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api)(.*)",
  ],
};
