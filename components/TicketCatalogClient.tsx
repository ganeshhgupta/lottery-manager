"use client";

import { useState } from "react";
import { TicketCatalogItem } from "@/lib/types";
import TicketImage from "@/components/TicketImage";

interface Props {
  initialCatalog: TicketCatalogItem[];
  isManager: boolean;
}

export default function TicketCatalogClient({ initialCatalog, isManager }: Props) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(""); setAddLoading(true);
    try {
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName, imageUrl: addUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? "Failed"); return; }
      setCatalog((prev) => [...prev, data.item]);
      setAddName(""); setAddUrl(""); setShowAdd(false);
    } catch { setAddError("Network error"); }
    finally { setAddLoading(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/catalog/${id}`, { method: "DELETE" });
      if (res.ok) setCatalog((prev) => prev.filter((t) => t.id !== id));
    } finally { setDeletingId(null); }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">← Dashboard</a>
            <span className="text-slate-600">|</span>
            <span className="text-white font-semibold">Ticket Catalog</span>
          </div>
          {isManager && (
            <button
              onClick={() => setShowAdd(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Add Ticket
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <p className="text-slate-400 text-sm mb-5">{catalog.length} tickets in catalog</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {catalog.map((ticket) => (
            <div key={ticket.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
              <div className="relative w-full aspect-square">
                <TicketImage imageUrl={ticket.imageUrl} ticketName={ticket.name} fill />
              </div>
              <div className="p-2 flex flex-col gap-2">
                <p className="text-white text-xs font-medium leading-tight line-clamp-2">{ticket.name}</p>
                {isManager && (
                  <button
                    onClick={() => handleDelete(ticket.id)}
                    disabled={deletingId === ticket.id}
                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors text-left"
                  >
                    {deletingId === ticket.id ? "Deleting…" : "Delete"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add Ticket Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAdd} className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4">
            <h2 className="text-base font-bold text-white">Add Ticket to Catalog</h2>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Ticket Name</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                required
                autoFocus
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Lucky 7s"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Image URL <span className="text-slate-600">(optional)</span></label>
              <input
                type="text"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://..."
              />
            </div>

            {addError && <p className="text-red-400 text-sm -mt-1">{addError}</p>}

            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowAdd(false); setAddError(""); }}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={addLoading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold text-sm rounded-lg transition-colors">
                {addLoading ? "Saving…" : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
