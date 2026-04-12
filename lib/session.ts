import { SessionOptions } from "iron-session";
import { SessionData } from "./types";

export const sessionOptions: SessionOptions = {
  cookieName: "lottery-audit-session",
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export type { SessionData };
