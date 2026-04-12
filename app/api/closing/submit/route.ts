import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { readData, writeData } from "@/lib/db";
import { appendClosingEntryToSheet } from "@/lib/sheets";
import { Shift, ClosingLogEntry, ClosingDelta } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: false });
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { shift, counts } = body as {
    shift: Shift;
    counts: Record<string, number>;
  };

  if (!shift || !counts) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const data = await readData();

  // Build changes array — accept any 0–999 count
  const changes: ClosingDelta[] = data.slots.map((slot) => {
    const key = String(slot.slotNumber);
    const raw = key in counts ? Number(counts[key]) : slot.currentCount;
    const newCount = Math.min(999, Math.max(0, Math.floor(raw)));
    const delta = newCount - slot.currentCount;
    return {
      slotNumber: slot.slotNumber,
      ticketName: slot.ticketName,
      previousCount: slot.currentCount,
      newCount,
      delta,
      flagged: delta > 0,
    };
  });

  const timestamp = new Date().toISOString();
  const date = timestamp.slice(0, 10);

  const entry: ClosingLogEntry = {
    entryId: uuidv4(),
    timestamp,
    date,
    shift,
    employeeId: session.employeeId,
    employeeName: session.employeeName,
    changes,
  };

  // Update slots
  data.slots = data.slots.map((slot) => {
    const change = changes.find((c) => c.slotNumber === slot.slotNumber)!;
    return {
      ...slot,
      currentCount: change.newCount,
      lastClosingDate: date,
      lastClosingShift: shift,
      lastClosingEmployee: session.employeeName,
    };
  });

  data.closingLog.push(entry);
  await writeData(data);

  // Async sheet backup — do not await or block on failure
  appendClosingEntryToSheet(entry).catch(() => {});

  const flagged = changes.filter((c) => c.flagged).map((c) => c.ticketName);

  return NextResponse.json({ ok: true, entry, flagged });
}
