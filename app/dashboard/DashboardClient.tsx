"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Slot, ClosingLogEntry } from "@/lib/types";
import TicketImage from "@/components/TicketImage";
import ClosingModal from "@/components/ClosingModal";
import AddTicketModal from "@/components/AddTicketModal";

interface Props {
  slots: Slot[];
  closingLog: ClosingLogEntry[];
}

interface UserInfo {
  employeeName: string;
  role: string;
}

export default function DashboardClient({ slots: initialSlots, closingLog: initialLog }: Props) {
  const router = useRouter();
  const [slots, setSlots] = useState(initialSlots);
  const [closingLog, setClosingLog] = useState(initialLog);
  const [version, setVersion] = useState(initialLog.length); // 0 = seed, 1..n = entry index
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [flaggedNames, setFlaggedNames] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserInfo(d))
      .catch(() => {});
  }, []);

  const totalVersions = closingLog.length + 1; // version 0 is seed
  const isLatest = version === closingLog.length;

  // Build the display state for the current version
  function getSlotsForVersion(v: number): Slot[] {
    if (v === closingLog.length) return slots;
    // Reconstruct slot counts from log entries up to version v
    const base: Slot[] = slots.map((s) => ({
      ...s,
      currentCount: 0,
      lastClosingDate: "",
      lastClosingShift: "Morning" as const,
      lastClosingEmployee: "N/A",
    }));
    // Apply log entries 0..v-1
    for (let i = 0; i < v; i++) {
      const entry = closingLog[i];
      entry.changes.forEach((c) => {
        const slot = base.find((s) => s.slotNumber === c.slotNumber);
        if (slot) {
          slot.currentCount = c.newCount;
          slot.lastClosingDate = entry.date;
          slot.lastClosingShift = entry.shift;
          slot.lastClosingEmployee = entry.employeeName;
        }
      });
    }
    return base;
  }

  const displaySlots = getSlotsForVersion(version);
  const currentEntry = version > 0 ? closingLog[version - 1] : null;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleClosingSuccess(updatedSlots: Slot[], newEntry: ClosingLogEntry, flagged: string[]) {
    setSlots(updatedSlots);
    setClosingLog((prev) => [...prev, newEntry]);
    setVersion((prev) => prev + 1);
    setFlaggedNames(flagged);
    setShowClosingModal(false);
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
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  userInfo.role === "manager"
                    ? "bg-indigo-600/30 text-indigo-300 border border-indigo-600/50"
                    : "bg-slate-700 text-slate-300"
                }`}>
                  {userInfo.role === "manager" ? "Manager" : "Employee"}
                </span>
                {userInfo.role === "manager" && (
                  <a href="/manager" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors hidden sm:inline">
                    Manager Panel
                  </a>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-3 py-1.5 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-1.5 rounded-lg transition-colors font-medium"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Flagged warning */}
        {flaggedNames.length > 0 && (
          <div className="mb-4 px-4 py-3 bg-amber-900/40 border border-amber-600/50 rounded-lg text-amber-300 text-sm flex items-start gap-2">
            <span className="text-lg leading-none mt-0.5">⚠</span>
            <div>
              <span className="font-semibold">Count increased for: </span>
              {flaggedNames.join(", ")}
              <button
                onClick={() => setFlaggedNames([])}
                className="ml-3 text-amber-400 hover:text-amber-200 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Version navigator */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setVersion((v) => Math.max(0, v - 1))}
              disabled={version === 0}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm rounded-lg transition-colors"
            >
              ← Prev
            </button>
            <div className="text-center">
              <span className="text-white font-medium">
                Dashboard (Version {version + 1} of {totalVersions})
              </span>
              {!isLatest && (
                <div className="text-amber-400 text-xs mt-0.5">
                  Viewing historical version — changes disabled
                </div>
              )}
            </div>
            <button
              onClick={() => setVersion((v) => Math.min(closingLog.length, v + 1))}
              disabled={isLatest}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm rounded-lg transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-slate-400">
            <span>
              <span className="text-slate-500">Date:</span>{" "}
              <span className="text-slate-200">{currentEntry?.date ?? "—"}</span>
            </span>
            <span>
              <span className="text-slate-500">Shift:</span>{" "}
              <span className="text-slate-200">{currentEntry?.shift ?? "—"}</span>
            </span>
            <span>
              <span className="text-slate-500">Last Closing Employee:</span>{" "}
              <span className="text-slate-200">{currentEntry?.employeeName ?? "—"}</span>
            </span>
          </div>
        </div>

        {/* Action buttons — only shown to logged-in users on latest version */}
        {isLatest && userInfo && (
          <div className="flex flex-wrap gap-3 mb-5">
            <button
              onClick={() => setShowClosingModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>+</span> Add Closing Entry
            </button>
            <button
              onClick={() => setShowAddTicketModal(true)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>🎟️</span> Edit Ticket
            </button>
          </div>
        )}

        {/* 6-column icon grid — all screen sizes */}
        <div className="grid grid-cols-6 gap-2 sm:gap-3">
          {displaySlots.map((slot) => {
            const hasCount = !(slot.lastClosingDate === "" && slot.currentCount === 0);
            return (
              <div key={slot.slotNumber} className="flex flex-col items-center gap-1">
                {/* Square ticket image */}
                <div className="relative w-full aspect-square">
                  <TicketImage
                    imageUrl={slot.imageUrl}
                    ticketName={slot.ticketName}
                    fill
                  />
                  {/* Slot number badge */}
                  <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] sm:text-xs font-bold px-1 sm:px-1.5 rounded leading-tight">
                    {slot.slotNumber}
                  </div>
                  {/* Count badge */}
                  <div className={`absolute bottom-1 right-1 text-[10px] sm:text-xs font-bold px-1 sm:px-1.5 rounded leading-tight ${
                    hasCount
                      ? "bg-indigo-600/90 text-white"
                      : "bg-slate-700/80 text-slate-400"
                  }`}>
                    {hasCount ? slot.currentCount : "—"}
                  </div>
                </div>
                {/* Ticket name */}
                <div className="text-[9px] sm:text-[11px] text-slate-400 text-center leading-tight w-full truncate px-0.5">
                  {slot.ticketName}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modals */}
      {showClosingModal && (
        <ClosingModal
          slots={slots}
          onClose={() => setShowClosingModal(false)}
          onSuccess={handleClosingSuccess}
        />
      )}
      {showAddTicketModal && (
        <AddTicketModal
          slots={slots}
          onClose={() => setShowAddTicketModal(false)}
          onSuccess={handleTicketSuccess}
        />
      )}
    </div>
  );
}
