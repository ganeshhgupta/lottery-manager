import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { readData, writeData } from "@/lib/db";
import { Employee } from "@/lib/types";

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
  const { id, name, pin, role } = body as Partial<Employee>;

  if (!id || !name || !pin) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
  }

  const data = await readData();
  if (data.employees.find((e) => e.id === id)) {
    return NextResponse.json({ error: "Employee ID already exists" }, { status: 409 });
  }

  const newEmployee: Employee = {
    id,
    name,
    pin,
    role: role === "manager" ? "manager" : "employee",
  };

  data.employees.push(newEmployee);
  await writeData(data);
  return NextResponse.json({ ok: true, employee: { id, name, role: newEmployee.role } });
}
