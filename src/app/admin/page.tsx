"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

export default function AdminPage() {
  const { data, isLoading, isError, error } = trpc.admin.dashboard.useQuery();

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <SignedOut>
        <div className="mt-4">
          <p className="text-gray-600">You must sign in as a librarian to view the dashboard.</p>
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
          <p className="text-red-600 mt-2">{error.message || "Failed to load dashboard."}</p>
        )}

        {data && (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="rounded-lg border p-4">
              <h2 className="text-lg font-medium">Overdue Loans</h2>
              {data.overdueLoans.length === 0 ? (
                <p className="text-gray-600 mt-2">No overdue loans. 🎉</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {data.overdueLoans.map((p) => (
                    <li key={p.id} className="rounded border p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/oeuvre/${encodeURIComponent(p.livre.oeuvre.cote)}`}
                            className="font-medium text-gray-900 hover:underline"
                          >
                            {p.livre.oeuvre.titre}
                          </Link>
                          <p className="text-sm text-gray-600">
                            Adherent: {p.adherent.nom} • Copy #{p.livre.numeroExemplaire}
                          </p>
                          <p className="text-sm text-red-600">
                            Due {new Date(p.dateEcheance).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border p-4">
              <h2 className="text-lg font-medium">Expiring Reservations (≤7 days)</h2>
              {data.expiringReservations.length === 0 ? (
                <p className="text-gray-600 mt-2">No reservations expiring soon.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {data.expiringReservations.map((r) => (
                    <li key={r.id} className="rounded border p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/oeuvre/${encodeURIComponent(r.oeuvre.cote)}`}
                            className="font-medium text-gray-900 hover:underline"
                          >
                            {r.oeuvre.titre}
                          </Link>
                          <p className="text-sm text-gray-600">Adherent: {r.adherent.nom}</p>
                          <p className="text-sm text-gray-700">Status: {r.status}</p>
                          <p className="text-sm text-amber-700">
                            Expires {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </SignedIn>
    </main>
  );
}
