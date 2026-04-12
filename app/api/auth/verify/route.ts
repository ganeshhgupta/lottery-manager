import { NextRequest, NextResponse } from "next/server";
import { readData } from "@/lib/db";

// Verify ID+PIN without creating a session — used by the closing modal
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { employeeId, pin } = body as { employeeId: string; pin: string };

  if (!employeeId || !pin) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const data = await readData();
  const employee = data.employees.find((e) => e.id === employeeId && e.pin === pin);

  if (!employee) {
    return NextResponse.json({ error: "Invalid ID or PIN" }, { status: 401 });
  }

  return NextResponse.json({ employeeId: employee.id, employeeName: employee.name, role: employee.role });
}
