"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";

export default function CataloguePage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isFetching, isFetched } = trpc.catalogue.search.useQuery(
    { q, page, pageSize },
    { enabled: q.trim().length > 0 }
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-semibold">Catalogue</h1>
      <div className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search by title, author, or keyword..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="mt-6">
        {q.trim().length === 0 && (
          <p className="text-gray-600">Type to search the catalogue.</p>
        )}
        {isFetching && <p className="text-gray-600">Searching...</p>}
        {isFetched && !isFetching && items.length === 0 && (
          <p className="text-gray-600">No results found.</p>
        )}

        <ul className="divide-y divide-gray-200 rounded-md border mt-2">
          {items.map((it) => (
            <li key={it.cote} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    <Link href={`/oeuvre/${encodeURIComponent(it.cote)}`} className="hover:underline">
                      {it.titre}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600">Cote: {it.cote}</p>
                  {it.authors && it.authors.length > 0 && (
                    <p className="text-sm text-gray-600">Authors: {it.authors.join(", ")}</p>
                  )}
                  {it.mots && it.mots.length > 0 && (
                    <p className="text-sm text-gray-600">Keywords: {it.mots.join(", ")}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    Available: <span className="font-semibold">{it.availableCopies}</span> / {it.totalCopies}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md bg-gray-100 px-3 py-2 text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md bg-gray-100 px-3 py-2 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
