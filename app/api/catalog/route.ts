import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { readData, writeData } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// Public — anyone can read the catalog
export async function GET() {
  const data = await readData();
  return NextResponse.json({ catalog: data.ticketCatalog });
}

// Manager-only — add a new ticket to the catalog
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: false });
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "manager") {
    return NextResponse.json({ error: "Manager only" }, { status: 403 });
  }

  const { name, imageUrl } = await req.json() as { name: string; imageUrl?: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const data = await readData();
  const item = { id: uuidv4(), name: name.trim(), imageUrl: imageUrl?.trim() ?? "" };
  data.ticketCatalog.push(item);
  await writeData(data);
  return NextResponse.json({ ok: true, item });
}
