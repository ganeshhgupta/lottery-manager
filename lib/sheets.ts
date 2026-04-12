/**
 * Google Sheets backup helper.
 *
 * SETUP REQUIRED:
 * 1. Create a Google Cloud service account and download its JSON key.
 * 2. Set GOOGLE_SERVICE_ACCOUNT_JSON env var to the full JSON key string.
 * 3. Share the Google Sheet (ID below) with the service account email as Editor.
 *    The service account email looks like: name@project.iam.gserviceaccount.com
 */

import { google } from "googleapis";
import { ClosingLogEntry } from "./types";

const SHEET_ID = "1w3oXVXXA_VDs4WoJnN28EcGVckl6C6FvHaJAQ3ViQso";
const SHEET_TAB = "Sheet1";

export async function appendClosingEntryToSheet(
  entry: ClosingLogEntry
): Promise<void> {
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credJson) {
    console.warn("[sheets] GOOGLE_SERVICE_ACCOUNT_JSON not set — skipping sheet backup.");
    return;
  }

  try {
    const credentials = JSON.parse(credJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

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

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A:K`,
      valueInputOption: "RAW",
      requestBody: { values: rows },
    });
  } catch (err) {
    console.error("[sheets] Failed to append to Google Sheet:", err);
    // Do NOT rethrow — sheet backup is non-blocking
  }
}
