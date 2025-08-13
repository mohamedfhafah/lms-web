"use client";

import { useAuth, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

export default function OeuvreDetailsPage({ params }: { params: { cote: string } }) {
  const { cote } = params;
  const { isSignedIn } = useAuth();
  const utils = trpc.useContext();
  const { data, isLoading, isFetched } = trpc.oeuvre.getByCote.useQuery({ cote });
  const reserveMut = trpc.reservation.create.useMutation({
    onSuccess: () => {
      // Keep it simple: refresh reservations list in cache if present
      utils.reservation.listMy.invalidate().catch(() => {});
    },
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  if (isFetched && !data) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-gray-600">Work not found.</p>
        <Link href="/catalogue" className="text-indigo-600 hover:underline">
          Back to catalogue
        </Link>
      </main>
    );
  }

  const d = data!;
  const date = d.dateParution ? new Date(d.dateParution).toLocaleDateString() : "N/A";

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-4">
        <Link href="/catalogue" className="text-indigo-600 hover:underline text-sm">← Back to catalogue</Link>
      </div>
      <h1 className="text-2xl font-semibold">{d.titre}</h1>
      <p className="text-gray-600 mt-1">Cote: {d.cote}</p>
      <p className="text-gray-600">Published: {date}</p>

      {d.authors.length > 0 && (
        <div className="mt-4">
          <h2 className="font-medium">Authors</h2>
          <p className="text-gray-700">{d.authors.join(", ")}</p>
        </div>
      )}

      {d.mots.length > 0 && (
        <div className="mt-4">
          <h2 className="font-medium">Keywords</h2>
          <div className="flex flex-wrap gap-2 mt-1">
            {d.mots.map((m) => (
              <span key={m} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 border">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="font-medium">Availability</h2>
        <p className="text-gray-700">
          Available: <span className="font-semibold">{d.availableCopies}</span> / {d.totalCopies}
        </p>
        {d.availableCopies === 0 && (
          <div className="mt-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                  Sign in to reserve
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button
                onClick={() => reserveMut.mutate({ oeuvreCote: cote })}
                disabled={!isSignedIn || reserveMut.isPending}
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                {reserveMut.isPending ? "Reserving..." : "Reserve"}
              </button>
            </SignedIn>
          </div>
        )}
      </div>
    </main>
  );
}
