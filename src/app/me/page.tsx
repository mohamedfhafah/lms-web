"use client";

import { trpc } from "../../lib/trpc/client";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function MePage() {
  const { data, isLoading, error } = trpc.adherent.me.useQuery(undefined, {
    retry: false,
  });

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>

      <SignedOut>
        <div className="space-y-2">
          <p>You must sign in to view your adherent profile.</p>
          <SignInButton mode="modal" />
        </div>
      </SignedOut>

      <SignedIn>
        {isLoading && <p>Loading…</p>}
        {error && (
          <pre className="text-red-600">{String(error.message || error)}</pre>
        )}
        {data && (
          <div className="rounded border p-4 text-sm">
            <p><span className="font-medium">nom:</span> {data.nom}</p>
            <p><span className="font-medium">role:</span> {data.role}</p>
            <p><span className="font-medium">id:</span> {data.id}</p>
          </div>
        )}
      </SignedIn>
    </main>
  );
}
