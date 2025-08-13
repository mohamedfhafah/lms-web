"use client";

import { useAuth, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

// Narrow type for items returned by `trpc.loan.listMy`
interface LoanItem {
  id: string;
  dateEmprunt: string | Date;
  dateEcheance: string | Date;
  dateRetourEffective: string | Date | null;
  renouvellements: number;
  livre: {
    id: string;
    numeroExemplaire: number;
    disponible: boolean;
    oeuvre: { cote: string; titre: string };
  };
}

export default function LoansPage() {
  const { isSignedIn } = useAuth();
  const utils = trpc.useContext();
  const { data, isLoading, isError, error } = trpc.loan.listMy.useQuery(undefined, {
    enabled: isSignedIn,
  });
  const renewMut = trpc.loan.renew.useMutation({
    onSuccess: () => utils.loan.listMy.invalidate(),
  });
  const returnMut = trpc.loan.return.useMutation({
    onSuccess: () => utils.loan.listMy.invalidate(),
  });

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-semibold">Loans</h1>
      <SignedOut>
        <div className="mt-4">
          <p className="text-gray-600">You must sign in to view your loans.</p>
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
          <p className="text-red-600 mt-2">{error.message || "Failed to load loans."}</p>
        )}
        {data && data.length === 0 && (
          <p className="text-gray-600 mt-2">No active or historical loans.</p>
        )}

        {data && data.length > 0 && (
          <ul className="mt-4 divide-y divide-gray-200 rounded-md border">
            {data.map((p: LoanItem) => {
              const due = new Date(p.dateEcheance).toLocaleDateString();
              const borrowed = new Date(p.dateEmprunt).toLocaleDateString();
              const returned = p.dateRetourEffective
                ? new Date(p.dateRetourEffective).toLocaleDateString()
                : null;
              const overdue = !returned && new Date(p.dateEcheance) < new Date();
              return (
                <li key={p.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/oeuvre/${encodeURIComponent(p.livre.oeuvre.cote)}`}
                        className="text-lg font-medium text-gray-900 hover:underline"
                      >
                        {p.livre.oeuvre.titre}
                      </Link>
                      <p className="text-sm text-gray-600">
                        Copy #{p.livre.numeroExemplaire} • Borrowed {borrowed}
                      </p>
                      <p className={`text-sm ${overdue ? "text-red-600" : "text-gray-700"}`}>
                        Due {due}
                      </p>
                      {returned && (
                        <p className="text-sm text-gray-600">Returned {returned}</p>
                      )}
                    </div>
                    {!returned && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => renewMut.mutate({ pretId: p.id })}
                          disabled={renewMut.isPending}
                          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-60"
                          title="Renew by one month"
                        >
                          {renewMut.isPending ? "Renewing..." : "Renew"}
                        </button>
                        <button
                          onClick={() => returnMut.mutate({ pretId: p.id })}
                          disabled={returnMut.isPending}
                          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-60"
                          title="Return this copy"
                        >
                          {returnMut.isPending ? "Returning..." : "Return"}
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
