import { readData } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await readData();

  return (
    <DashboardClient
      slots={data.slots}
      closingLog={data.closingLog}
      catalog={data.ticketCatalog}
    />
  );
}
