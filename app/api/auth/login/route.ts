import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { readData } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { employeeId, pin } = body as { employeeId: string; pin: string };

  if (!employeeId || !pin) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const data = await readData();
  const employee = data.employees.find(
    (e) => e.id === employeeId && e.pin === pin
  );

  if (!employee) {
    return NextResponse.json({ error: "Invalid ID or PIN" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.employeeId = employee.id;
  session.employeeName = employee.name;
  session.role = employee.role;
  await session.save();

  return res;
}
