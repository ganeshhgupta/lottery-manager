import { ClosingLogEntry } from "./types";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxSnYWCXQUXKxOVmp24eZk9TPSRMTcgmZzj-wQwXRk3OLcTF9Z2TxWXS99tBc9RPLH6/exec";

export async function appendClosingEntryToSheet(
  entry: ClosingLogEntry
): Promise<void> {
  try {
    const rows = entry.changes.map((c) => [
      entry.timestamp,
      entry.date,
      entry.shift,
      entry.employeeName,
      entry.employeeId,
      c.slotNumber,
      c.ticketName,
      c.previousCount,
      c.newCount,
      c.delta,
      c.flagged ? "YES" : "NO",
    ]);

    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });

    if (!res.ok) {
      console.error("[sheets] Apps Script returned:", res.status);
    }
  } catch (err) {
    console.error("[sheets] Failed to append to sheet:", err);
  }
}
