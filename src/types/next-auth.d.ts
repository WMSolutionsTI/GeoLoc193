import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      pa: string;
      allowedApps: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    pa: string;
    allowedApps: string[];
    sessionToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    pa: string;
    allowedApps: string[];
    sessionToken?: string;
  }
}