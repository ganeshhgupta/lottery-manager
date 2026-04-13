import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { readData, writeData } from "@/lib/db";

// Manager-only — delete a ticket from the catalog
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const res = NextResponse.json({ ok: false });
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "manager") {
    return NextResponse.json({ error: "Manager only" }, { status: 403 });
  }

  const data = await readData();
  const before = data.ticketCatalog.length;
  data.ticketCatalog = data.ticketCatalog.filter((t) => t.id !== params.id);
  if (data.ticketCatalog.length === before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await writeData(data);
  return NextResponse.json({ ok: true });
}
