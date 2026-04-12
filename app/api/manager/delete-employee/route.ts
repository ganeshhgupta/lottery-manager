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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id } = body as { id: string };

  if (!id) {
    return NextResponse.json({ error: "Missing employee id" }, { status: 400 });
  }
  if (id === "1") {
    return NextResponse.json({ error: "Cannot delete the main manager account." }, { status: 403 });
  }
  if (id === session.employeeId) {
    return NextResponse.json({ error: "Cannot delete your own account." }, { status: 403 });
  }

  const data = await readData();
  const before = data.employees.length;
  data.employees = data.employees.filter((e) => e.id !== id);
  if (data.employees.length === before) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  await writeData(data);
  return NextResponse.json({ ok: true });
}
