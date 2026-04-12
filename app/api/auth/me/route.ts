import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";

export async function GET(req: NextRequest) {
  const res = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.employeeId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({
    employeeId: session.employeeId,
    employeeName: session.employeeName,
    role: session.role,
  });
}
