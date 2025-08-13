"use client";

import { useAuth, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

// Narrow type for items returned by `trpc.reservation.listMy`
interface ReservationItem {
  id: string;
  status: "PENDING" | "NOTIFIED" | "EXPIRED" | "CANCELLED" | "FULFILLED";
  createdAt: string | Date;
  notifiedAt: string | Date | null;
  expiresAt: string | Date | null;
  oeuvre: { cote: string; titre: string };
}

export default function ReservationsPage() {
  const { isSignedIn } = useAuth();
  const utils = trpc.useContext();
  const { data, isLoading, isError, error } = trpc.reservation.listMy.useQuery(undefined, {
    enabled: isSignedIn,
  });
  const cancelMut = trpc.reservation.cancel.useMutation({
    onSuccess: () => utils.reservation.listMy.invalidate(),
  });

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-semibold">Reservations</h1>
      <SignedOut>
        <div className="mt-4">
          <p className="text-gray-600">You must sign in to view your reservations.</p>
          <SignInButton mode="modal">
            <button className="mt-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Sign in
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        {isLoading && <p className="text-gray-600 mt-2">Loading...</p>}
        {isError && (
          <p className="text-red-600 mt-2">{error.message || "Failed to load reservations."}</p>
        )}
        {data && data.length === 0 && (
          <p className="text-gray-600 mt-2">No reservations yet.</p>
        )}

        {data && data.length > 0 && (
          <ul className="mt-4 divide-y divide-gray-200 rounded-md border">
            {data.map((r: ReservationItem) => {
              const created = new Date(r.createdAt).toLocaleDateString();
              const notified = r.notifiedAt ? new Date(r.notifiedAt).toLocaleDateString() : null;
              const expires = r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : null;
              const cancellable = r.status === "PENDING" || r.status === "NOTIFIED";
              return (
                <li key={r.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/oeuvre/${encodeURIComponent(r.oeuvre.cote)}`}
                        className="text-lg font-medium text-gray-900 hover:underline"
                      >
                        {r.oeuvre.titre}
                      </Link>
                      <p className="text-sm text-gray-600">Cote: {r.oeuvre.cote}</p>
                      <p className="text-sm text-gray-700">Status: {r.status}</p>
                      <p className="text-sm text-gray-600">Created: {created}</p>
                      {notified && (
                        <p className="text-sm text-gray-600">Notified: {notified}</p>
                      )}
                      {expires && (
                        <p className="text-sm text-gray-600">Expires: {expires}</p>
                      )}
                    </div>
                    {cancellable && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => cancelMut.mutate({ reservationId: r.id })}
                          disabled={cancelMut.isPending}
                          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-60"
                        >
                          {cancelMut.isPending ? "Cancelling..." : "Cancel"}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SignedIn>
    </main>
  );
}
