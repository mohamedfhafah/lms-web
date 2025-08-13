"use client";

import { trpc } from "../../lib/trpc/client";

export default function HealthPage() {
  const { data, isLoading, error } = trpc.health.ping.useQuery();

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Health</h1>
      {isLoading && <p>Loading…</p>}
      {error && (
        <pre className="text-red-600">{String(error.message || error)}</pre>
      )}
      {data && (
        <div className="rounded border p-4">
          <p>ok: {String(data.ok)}</p>
          <p>time: {data.time}</p>
        </div>
      )}
    </main>
  );
}
