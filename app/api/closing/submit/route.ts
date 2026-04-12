import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/db";
import { appendClosingEntryToSheet } from "@/lib/sheets";
import { Shift, ClosingLogEntry, ClosingDelta } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { employeeId, pin, shift, counts } = body as {
    employeeId: string;
    pin: string;
    shift: Shift;
    counts: Record<string, number>;
  };

  if (!employeeId || !pin || !shift || !counts) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const data = await readData();

  // Re-verify credentials server-side
  const employee = data.employees.find((e) => e.id === employeeId && e.pin === pin);
  if (!employee) {
    return NextResponse.json({ error: "Invalid ID or PIN" }, { status: 401 });
  }

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
    employeeId: employee.id,
    employeeName: employee.name,
    changes,
  };

  data.slots = data.slots.map((slot) => {
    const change = changes.find((c) => c.slotNumber === slot.slotNumber)!;
    return {
      ...slot,
      currentCount: change.newCount,
      lastClosingDate: date,
      lastClosingShift: shift,
      lastClosingEmployee: employee.name,
    };
  });

  data.closingLog.push(entry);
  await writeData(data);

  appendClosingEntryToSheet(entry).catch(() => {});

  const flagged = changes.filter((c) => c.flagged).map((c) => c.ticketName);
  return NextResponse.json({ ok: true, entry, flagged });
}
