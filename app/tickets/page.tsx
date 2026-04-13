import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { readData } from "@/lib/db";
import TicketCatalogClient from "@/components/TicketCatalogClient";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const cookieStore = cookies();
  const session = await getIronSession<SessionData>(cookieStore as never, sessionOptions);
  const data = await readData();

  return (
    <TicketCatalogClient
      initialCatalog={data.ticketCatalog}
      isManager={session.role === "manager"}
    />
  );
}
