"use client";

import { useState } from "react";
import { Slot } from "@/lib/types";

interface Props {
  slots: Slot[];
  onClose: () => void;
  onSuccess: (updatedSlot: Slot) => void;
}

export default function AddTicketModal({ slots, onClose, onSuccess }: Props) {
  const [slotNumber, setSlotNumber] = useState(1);
  const [ticketName, setTicketName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill when slot changes
  function handleSlotChange(num: number) {
    setSlotNumber(num);
    const slot = slots.find((s) => s.slotNumber === num);
    if (slot) {
      setTicketName(slot.ticketName);
      setImageUrl(slot.imageUrl);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tickets/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotNumber, ticketName, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update ticket");
      } else {
        onSuccess(data.slot as Slot);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Add / Edit Ticket</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Slot Number</label>
            <select
              value={slotNumber}
              onChange={(e) => handleSlotChange(Number(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {slots.map((s) => (
                <option key={s.slotNumber} value={s.slotNumber}>
                  Slot {s.slotNumber} — {s.ticketName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Ticket Name</label>
            <input
              type="text"
              value={ticketName}
              onChange={(e) => setTicketName(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Lucky 7s"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Image URL <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://..."
            />
          </div>

          <p className="text-xs text-slate-500">
            Note: Only managers can save changes. If you are not a manager, the form will be rejected.
          </p>

          {error && (
            <div className="px-4 py-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? "Saving…" : "Save Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
