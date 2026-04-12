import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";

// Only these paths require a valid session
// Note: /api/closing/submit handles its own auth via employeeId+pin in body
const PROTECTED_PATHS = [
  "/tickets",
  "/manager",
  "/api/tickets",
  "/api/manager",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (!session.employeeId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Manager-only routes
  if (pathname.startsWith("/manager") && session.role !== "manager") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
