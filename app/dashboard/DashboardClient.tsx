"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Slot, ClosingLogEntry, Shift } from "@/lib/types";
import TicketImage from "@/components/TicketImage";
import AddTicketModal from "@/components/AddTicketModal";

interface Props {
  slots: Slot[];
  closingLog: ClosingLogEntry[];
}

interface UserInfo { employeeName: string; role: string; }

type ClosingMode = "off" | "auth" | "edit";

function getAutoShift(): Shift {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return "Morning";
  if (h >= 14 && h < 22) return "Afternoon";
  return "Night";
}

function padCount(n: number): string {
  return String(n).padStart(3, "0");
}

export default function DashboardClient({ slots: initialSlots, closingLog: initialLog }: Props) {
  const router = useRouter();
  const [slots, setSlots] = useState(initialSlots);
  const [closingLog, setClosingLog] = useState(initialLog);
  const [version, setVersion] = useState(initialLog.length);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [flaggedNames, setFlaggedNames] = useState<string[]>([]);

  // Inline closing state
  const [closingMode, setClosingMode] = useState<ClosingMode>("off");
  const [authEmpId, setAuthEmpId] = useState("");
  const [authPin, setAuthPin] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [verifiedId, setVerifiedId] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [shift, setShift] = useState<Shift>(getAutoShift());
  const [editCounts, setEditCounts] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUserInfo(d)).catch(() => {});
  }, []);

  const totalVersions = closingLog.length + 1;
  const isLatest = version === closingLog.length;

  function getSlotsForVersion(v: number): Slot[] {
    if (v === closingLog.length) return slots;
    const base: Slot[] = slots.map((s) => ({
      ...s, currentCount: 0, lastClosingDate: "", lastClosingShift: "Morning" as const, lastClosingEmployee: "N/A",
    }));
    for (let i = 0; i < v; i++) {
      closingLog[i].changes.forEach((c) => {
        const slot = base.find((s) => s.slotNumber === c.slotNumber);
        if (slot) {
          slot.currentCount = c.newCount;
          slot.lastClosingDate = closingLog[i].date;
          slot.lastClosingShift = closingLog[i].shift;
          slot.lastClosingEmployee = closingLog[i].employeeName;
        }
      });
    }
    return base;
  }

  const displaySlots = getSlotsForVersion(version);
  const currentEntry = version > 0 ? closingLog[version - 1] : null;

  function startClosing() {
    setAuthEmpId(""); setAuthPin(""); setAuthError("");
    setClosingMode("auth");
  }

  function cancelClosing() {
    setClosingMode("off");
    setAuthEmpId(""); setAuthPin(""); setVerifiedId(""); setVerifiedName(""); setSubmitError("");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(""); setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: authEmpId, pin: authPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "Invalid ID or PIN");
      } else {
        setVerifiedId(data.employeeId); setVerifiedName(data.employeeName);
        const init: Record<string, string> = {};
        slots.forEach((s) => { init[s.slotNumber] = padCount(s.currentCount); });
        setEditCounts(init);
        setShift(getAutoShift());
        setSubmitError("");
        setClosingMode("edit");
      }
    } catch { setAuthError("Network error."); }
    finally { setAuthLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(""); setSubmitLoading(true);
    try {
      // Send counts as strings (preserving leading zeros) — API accepts both
      const countsStr: Record<string, string> = {};
      slots.forEach((s) => {
        const raw = editCounts[s.slotNumber] ?? "";
        // Strip non-digit chars, keep leading zeros, clamp to 3 digits
        const digits = raw.replace(/\D/g, "").slice(0, 3);
        countsStr[s.slotNumber] = digits === "" ? padCount(s.currentCount) : digits;
      });
      const res = await fetch("/api/closing/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: verifiedId, pin: authPin, shift, counts: countsStr }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Submission failed");
      } else {
        const entry: ClosingLogEntry = data.entry;
        const updatedSlots = slots.map((s) => {
          const change = entry.changes.find((c) => c.slotNumber === s.slotNumber);
          return change ? { ...s, currentCount: change.newCount, lastClosingDate: entry.date, lastClosingShift: entry.shift, lastClosingEmployee: entry.employeeName } : s;
        });
        setSlots(updatedSlots);
        setClosingLog((prev) => [...prev, entry]);
        setVersion((prev) => prev + 1);
        setFlaggedNames(data.flagged ?? []);
        cancelClosing();
      }
    } catch { setSubmitError("Network error."); }
    finally { setSubmitLoading(false); }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleTicketSuccess(updatedSlot: Slot) {
    setSlots((prev) => prev.map((s) => s.slotNumber === updatedSlot.slotNumber ? updatedSlot : s));
    setShowAddTicketModal(false);
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎟️</span>
            <span className="text-xl font-bold text-white">LotteryAudit</span>
          </div>
          <div className="flex items-center gap-3">
            {userInfo ? (
              <>
                <span className="text-slate-300 text-sm hidden sm:inline">{userInfo.employeeName}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${userInfo.role === "manager" ? "bg-indigo-600/30 text-indigo-300 border border-indigo-600/50" : "bg-slate-700 text-slate-300"}`}>
                  {userInfo.role === "manager" ? "Manager" : "Employee"}
                </span>
                {userInfo.role === "manager" && (
                  <a href="/manager" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors hidden sm:inline">Manager Panel</a>
                )}
                <button onClick={handleLogout} className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-3 py-1.5 rounded-lg transition-colors">Logout</button>
              </>
            ) : (
              <a href="/login" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-1.5 rounded-lg transition-colors font-medium">Sign In</a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Flagged warning */}
        {flaggedNames.length > 0 && (
          <div className="mb-4 px-4 py-3 bg-amber-900/40 border border-amber-600/50 rounded-lg text-amber-300 text-sm flex items-start gap-2">
            <span className="text-lg leading-none mt-0.5">⚠</span>
            <div>
              <span className="font-semibold">Count increased for: </span>{flaggedNames.join(", ")}
              <button onClick={() => setFlaggedNames([])} className="ml-3 text-amber-400 hover:text-amber-200 underline">Dismiss</button>
            </div>
          </div>
        )}

        {/* ── EDIT MODE ── */}
        {closingMode === "edit" && (
          <form onSubmit={handleSubmit}>
            {/* Edit meta bar */}
            <div className="mb-4 bg-slate-800 border border-indigo-500/50 rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Employee</span>
                  <span className="text-sm font-semibold text-white">{verifiedName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Date</span>
                  <span className="text-sm text-slate-200">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Shift</span>
                  <select value={shift} onChange={(e) => setShift(e.target.value as Shift)}
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Morning">Morning (6am–2pm)</option>
                    <option value="Afternoon">Afternoon (2pm–10pm)</option>
                    <option value="Night">Night (10pm–6am)</option>
                  </select>
                </div>
                <div className="flex gap-2 ml-auto">
                  <button type="button" onClick={cancelClosing} className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">Cancel</button>
                  <button type="submit" disabled={submitLoading}
                    className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold text-sm rounded-lg transition-colors">
                    {submitLoading ? "Saving…" : "Submit Closing"}
                  </button>
                </div>
              </div>
              {submitError && <p className="mt-2 text-red-400 text-sm">{submitError}</p>}
            </div>

            {/* Editable grid */}
            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {slots.map((slot) => (
                <div key={slot.slotNumber} className="flex flex-col gap-1">
                  <div className="relative w-full aspect-square">
                    <TicketImage imageUrl={slot.imageUrl} ticketName={slot.ticketName} fill />
                    <div className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[9px] sm:text-[10px] font-bold px-1 rounded leading-tight">
                      {slot.slotNumber}
                    </div>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    value={editCounts[slot.slotNumber] ?? ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 3);
                      setEditCounts((prev) => ({ ...prev, [slot.slotNumber]: val }));
                    }}
                    className="w-full bg-slate-700 border border-indigo-500/50 rounded px-1 py-1 text-white text-center text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          </form>
        )}

        {/* ── VIEW MODE ── */}
        {closingMode !== "edit" && (
          <>
            {/* Version navigator */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setVersion((v) => Math.max(0, v - 1))} disabled={version === 0}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm rounded-lg transition-colors">
                  ← Prev
                </button>
                <div className="text-center">
                  <span className="text-white font-medium">Version {version + 1} of {totalVersions}</span>
                  {!isLatest && <div className="text-amber-400 text-xs mt-0.5">Historical — read only</div>}
                </div>
                <button onClick={() => setVersion((v) => Math.min(closingLog.length, v + 1))} disabled={isLatest}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm rounded-lg transition-colors">
                  Next →
                </button>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span><span className="text-slate-500">Date:</span> <span className="text-slate-200">{currentEntry?.date ?? "—"}</span></span>
                <span><span className="text-slate-500">Shift:</span> <span className="text-slate-200">{currentEntry?.shift ?? "—"}</span></span>
                <span><span className="text-slate-500">Employee:</span> <span className="text-slate-200">{currentEntry?.employeeName ?? "—"}</span></span>
              </div>
            </div>

            {/* Action buttons */}
            {isLatest && (
              <div className="flex flex-wrap gap-3 mb-4">
                <button onClick={startClosing}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors">
                  + Add Closing Entry
                </button>
                {userInfo && (
                  <button onClick={() => setShowAddTicketModal(true)}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-5 py-2.5 rounded-lg transition-colors">
                    🎟️ Edit Ticket
                  </button>
                )}
              </div>
            )}

            {/* View grid */}
            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {displaySlots.map((slot) => {
                const hasCount = !(slot.lastClosingDate === "" && slot.currentCount === 0);
                return (
                  <div key={slot.slotNumber} className="flex flex-col gap-1">
                    <div className="relative w-full aspect-square">
                      <TicketImage imageUrl={slot.imageUrl} ticketName={slot.ticketName} fill />
                      <div className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[9px] sm:text-[10px] font-bold px-1 rounded leading-tight">
                        {slot.slotNumber}
                      </div>
                      <div className={`absolute bottom-0.5 right-0.5 text-[9px] sm:text-[10px] font-bold px-1 rounded leading-tight ${hasCount ? "bg-indigo-600/90 text-white" : "bg-slate-700/80 text-slate-400"}`}>
                        {hasCount ? padCount(slot.currentCount) : "—"}
                      </div>
                    </div>
                    <div className="text-[9px] sm:text-[11px] text-slate-400 text-center leading-tight w-full truncate px-0.5">
                      {slot.ticketName}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* ── AUTH POPUP ── */}
      {closingMode === "auth" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleVerify} className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-xs flex flex-col gap-4">
            <h2 className="text-base font-bold text-white text-center">Employee Sign-In</h2>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Employee ID</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={authEmpId}
                onChange={(e) => setAuthEmpId(e.target.value)}
                required
                autoFocus
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="ID"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={authPin}
                onChange={(e) => setAuthPin(e.target.value)}
                required
                maxLength={4}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white tracking-[0.5em] text-center text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••"
              />
            </div>

            {authError && (
              <p className="text-red-400 text-sm text-center -mt-1">{authError}</p>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={cancelClosing}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={authLoading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold text-sm rounded-lg transition-colors">
                {authLoading ? "…" : "Continue →"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddTicketModal && (
        <AddTicketModal slots={slots} onClose={() => setShowAddTicketModal(false)} onSuccess={handleTicketSuccess} />
      )}
    </div>
  );
}
