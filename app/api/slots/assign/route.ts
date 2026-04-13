import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/db";

// Self-authenticating with employeeId+pin — assigns a catalog ticket to a slot.
// Used during the closing entry flow (no session required).
export async function POST(req: NextRequest) {
  const { employeeId, pin, slotNumber, ticketName, imageUrl } = await req.json() as {
    employeeId: string;
    pin: string;
    slotNumber: number;
    ticketName: string;
    imageUrl: string;
  };

  if (!employeeId || !pin || !slotNumber || !ticketName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const data = await readData();

  const employee = data.employees.find((e) => e.id === employeeId && e.pin === pin);
  if (!employee) {
    return NextResponse.json({ error: "Invalid ID or PIN" }, { status: 401 });
  }

  const idx = data.slots.findIndex((s) => s.slotNumber === Number(slotNumber));
  if (idx === -1) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  data.slots[idx] = { ...data.slots[idx], ticketName, imageUrl: imageUrl ?? "" };
  await writeData(data);
  return NextResponse.json({ ok: true, slot: data.slots[idx] });
}
