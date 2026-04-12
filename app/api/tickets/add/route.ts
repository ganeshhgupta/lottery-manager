import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { readData, writeData } from "@/lib/db";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: false });
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "manager") {
    return NextResponse.json(
      { error: "Only managers can add or edit tickets." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { slotNumber, ticketName, imageUrl } = body as {
    slotNumber: number;
    ticketName: string;
    imageUrl?: string;
  };

  if (!slotNumber || !ticketName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const data = await readData();
  const idx = data.slots.findIndex((s) => s.slotNumber === Number(slotNumber));
  if (idx === -1) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  data.slots[idx] = {
    ...data.slots[idx],
    ticketName,
    imageUrl: imageUrl ?? "",
  };

  await writeData(data);
  return NextResponse.json({ ok: true, slot: data.slots[idx] });
}
