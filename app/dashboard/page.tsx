import { readData } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
