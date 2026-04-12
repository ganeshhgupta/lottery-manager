import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { readData } from "@/lib/db";

export async function GET(req: NextRequest) {
  const res = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const data = await readData();
  // Never return PINs
  const employees = data.employees.map(({ id, name, role }) => ({ id, name, role }));
  return NextResponse.json({ employees });
}
