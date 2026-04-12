"use client";

import { useState } from "react";
import { Slot, ClosingLogEntry, Shift } from "@/lib/types";
import TicketImage from "@/components/TicketImage";

interface Props {
  slots: Slot[];
  onClose: () => void;
  onSuccess: (updatedSlots: Slot[], newEntry: ClosingLogEntry, flagged: string[]) => void;
}

function getAutoShift(): Shift {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return "Morning";
  if (h >= 14 && h < 22) return "Afternoon";
  return "Night";
}

function todayDate(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function ClosingModal({ slots, onClose, onSuccess }: Props) {
  // Step 1: auth
  const [step, setStep] = useState<"auth" | "counts">("auth");
  const [empId, setEmpId] = useState("");
  const [pin, setPin] = useState("");
  const [verifiedId, setVerifiedId] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Step 2: counts
  const [shift, setShift] = useState<Shift>(getAutoShift());
  const [counts, setCounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    slots.forEach((s) => { init[s.slotNumber] = String(s.currentCount); });
    return init;
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "Invalid ID or PIN");
      } else {
        setVerifiedId(data.employeeId);
        setVerifiedName(data.employeeName);
        setStep("counts");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSubmitLoading(true);
    try {
      const countsNum: Record<string, number> = {};
      for (const [k, v] of Object.entries(counts)) {
        const n = parseInt(v, 10);
        countsNum[k] = isNaN(n) ? 0 : Math.min(999, Math.max(0, n));
      }
      const res = await fetch("/api/closing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: verifiedId, pin, shift, counts: countsNum }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Submission failed");
      } else {
        const entry: ClosingLogEntry = data.entry;
        const updatedSlots = slots.map((s) => {
          const change = entry.changes.find((c) => c.slotNumber === s.slotNumber);
          if (!change) return s;
          return { ...s, currentCount: change.newCount, lastClosingDate: entry.date, lastClosingShift: entry.shift, lastClosingEmployee: entry.employeeName };
        });
        onSuccess(updatedSlots, entry, data.flagged ?? []);
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-white">New Closing Entry</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* ── STEP 1: ID / PIN ── */}
        {step === "auth" && (
          <form onSubmit={handleVerify} className="flex flex-col gap-5 px-6 py-6">
            <p className="text-slate-400 text-sm">Enter your Employee ID and PIN to continue.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 101"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">PIN</label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                  maxLength={4}
                  inputMode="numeric"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white tracking-widest text-center text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••"
                />
              </div>
            </div>

            {authError && (
              <div className="px-4 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">{authError}</div>
            )}

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={authLoading} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-lg transition-colors">
                {authLoading ? "Verifying…" : "Continue →"}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: COUNT GRID ── */}
        {step === "counts" && (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">

            {/* Meta bar */}
            <div className="px-5 py-3 border-b border-slate-700 flex flex-wrap gap-x-6 gap-y-2 items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Employee</span>
                <span className="text-sm font-semibold text-white">{verifiedName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Date</span>
                <span className="text-sm text-slate-200">{todayDate()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Shift</span>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value as Shift)}
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Morning">Morning (6am–2pm)</option>
                  <option value="Afternoon">Afternoon (2pm–10pm)</option>
                  <option value="Night">Night (10pm–6am)</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <div className="grid grid-cols-6 gap-2 sm:gap-3">
                {slots.map((slot) => (
                  <div key={slot.slotNumber} className="flex flex-col gap-1">
                    {/* Image square */}
                    <div className="relative w-full aspect-square">
                      <TicketImage imageUrl={slot.imageUrl} ticketName={slot.ticketName} fill />
                      <div className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[9px] sm:text-[10px] font-bold px-1 rounded leading-tight">
                        {slot.slotNumber}
                      </div>
                    </div>
                    {/* Count input */}
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={counts[slot.slotNumber] ?? ""}
                      onChange={(e) => setCounts((prev) => ({ ...prev, [slot.slotNumber]: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-1 py-1 text-white text-center text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {submitError && (
              <div className="mx-4 mb-2 px-4 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm flex-shrink-0">
                {submitError}
              </div>
            )}

            <div className="px-5 py-4 border-t border-slate-700 flex gap-3 justify-between items-center flex-shrink-0">
              <button type="button" onClick={() => setStep("auth")} className="text-slate-400 hover:text-white text-sm transition-colors">
                ← Back
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitLoading} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-lg transition-colors">
                  {submitLoading ? "Saving…" : "Submit Closing Entry"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
