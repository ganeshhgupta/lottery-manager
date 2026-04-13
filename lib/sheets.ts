import { ClosingLogEntry } from "./types";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxSnYWCXQUXKxOVmp24eZk9TPSRMTcgmZzj-wQwXRk3OLcTF9Z2TxWXS99tBc9RPLH6/exec";

// Google Apps Script POST triggers a 302 redirect that drops the body.
// GET requests reach the script directly without a redirect.
// The script's doGet(e) reads e.parameter.data as a JSON string.
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

    const payload = encodeURIComponent(JSON.stringify({ rows }));
    const res = await fetch(`${APPS_SCRIPT_URL}?data=${payload}`, {
      method: "GET",
    });

    const text = await res.text();
    console.log("[sheets] Apps Script response:", text.slice(0, 200));
  } catch (err) {
    console.error("[sheets] Failed to append to sheet:", err);
  }
}
