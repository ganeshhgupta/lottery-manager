"use client";

import { useState } from "react";
import { Slot, ClosingLogEntry, Shift } from "@/lib/types";

interface Props {
  slots: Slot[];
  onClose: () => void;
  onSuccess: (updatedSlots: Slot[], newEntry: ClosingLogEntry, flagged: string[]) => void;
}

export default function ClosingModal({ slots, onClose, onSuccess }: Props) {
  const [shift, setShift] = useState<Shift>("Morning");
  const [counts, setCounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    slots.forEach((s) => { init[s.slotNumber] = String(s.currentCount); });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const countsNum: Record<string, number> = {};
      for (const [k, v] of Object.entries(counts)) {
        const n = parseInt(v, 10);
        if (isNaN(n) || n < 0) {
          setError(`Invalid count for slot ${k}`);
          setLoading(false);
          return;
        }
        countsNum[k] = n;
      }
      const res = await fetch("/api/closing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift, counts: countsNum }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submission failed");
      } else {
        // Rebuild updated slots from entry
        const entry: ClosingLogEntry = data.entry;
        const updatedSlots = slots.map((s) => {
          const change = entry.changes.find((c) => c.slotNumber === s.slotNumber);
          if (!change) return s;
          return {
            ...s,
            currentCount: change.newCount,
            lastClosingDate: entry.date,
            lastClosingShift: entry.shift,
            lastClosingEmployee: entry.employeeName,
          };
        });
        onSuccess(updatedSlots, entry, data.flagged ?? []);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">New Closing Entry</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Shift selector */}
          <div className="px-6 py-4 border-b border-slate-700">
            <label className="block text-sm font-medium text-slate-300 mb-2">Shift</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as Shift)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Morning">Morning (5:00 AM – 12:59 PM)</option>
              <option value="Day">Day (1:00 PM – 8:59 PM)</option>
              <option value="Night">Night (9:00 PM – 4:59 AM)</option>
            </select>
          </div>

          {/* Slots table */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs uppercase">
                  <th className="text-left px-3 py-2 w-12">Slot</th>
                  <th className="text-left px-3 py-2">Ticket Name</th>
                  <th className="text-right px-3 py-2 w-28">Prev Count</th>
                  <th className="text-right px-3 py-2 w-32">New Count</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.slotNumber} className="border-t border-slate-700/50">
                    <td className="px-3 py-2 text-slate-400 font-mono">{slot.slotNumber}</td>
                    <td className="px-3 py-2 text-white">{slot.ticketName}</td>
                    <td className="px-3 py-2 text-right text-slate-400 font-mono">
                      {slot.lastClosingDate === "" && slot.currentCount === 0 ? "—" : slot.currentCount}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        value={counts[slot.slotNumber] ?? ""}
                        onChange={(e) =>
                          setCounts((prev) => ({ ...prev, [slot.slotNumber]: e.target.value }))
                        }
                        className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-right font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mb-3 px-4 py-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700 flex gap-3 justify-end">
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
              {loading ? "Saving…" : "Submit Closing Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
