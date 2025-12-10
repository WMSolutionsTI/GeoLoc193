import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateToken } from "@/lib/utils";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Nome de usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const user = await db.query.users.findFirst({
            where: eq(users.username, credentials.username),
          });

          if (!user || !user.active) {
            return null;
          }

          // TODO: In production, use bcrypt to hash and compare passwords
          // This plain text comparison is for development only
          // Example: const isValid = await bcrypt.compare(credentials.password, user.password);
          if (user.password !== credentials.password) {
            return null;
          }

          // Generate a new session token and store it in the database
          // This invalidates any previous sessions for this user
          const newSessionToken = generateToken(32);
          
          // Update session token using explicit column reference
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updateData: Record<string, any> = {
            sessionToken: newSessionToken,
            updatedAt: new Date(),
          };
          
          await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, user.id));

          return {
            id: String(user.id),
            name: user.name,
            role: user.role,
            pa: user.pa || "",
            allowedApps: (user.allowedApps as string[]) || [],
            sessionToken: newSessionToken,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.pa = user.pa;
        token.allowedApps = user.allowedApps || [];
        token.sessionToken = user.sessionToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.pa = token.pa as string;
        session.user.allowedApps = (token.allowedApps as string[]) || [];
        
        // Validate session token is still valid (single session enforcement)
        try {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(token.id as string, 10)),
          });
          
          if (!dbUser || dbUser.sessionToken !== token.sessionToken) {
            // Session is no longer valid (user logged in elsewhere)
            throw new Error("Session expired");
          }
        } catch (error) {
          // Session validation failed - log and invalidate session
          console.error("Session validation error:", error);
          return { ...session, user: undefined, expires: new Date(0).toISOString() };
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};