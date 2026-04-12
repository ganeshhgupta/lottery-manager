import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { readData } from "@/lib/db";
import DashboardClient from "./DashboardClient";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Read session from cookies
  const cookieStore = cookies();
  // Build a minimal request-like object for getIronSession
  const cookieHeader = cookieStore.toString();

  const data = await readData();

  // We can't use getIronSession in a Server Component directly without a Request,
  // so we pass all data to client and let the client handle auth display
  return (
    <DashboardClient
      slots={data.slots}
      closingLog={data.closingLog}
    />
  );
}
