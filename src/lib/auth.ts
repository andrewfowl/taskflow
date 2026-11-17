import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

// Self-hosted authentication: credentials are verified against our own
// Postgres (bcrypt hashes). No third-party identity provider is required, so
// the platform can be self-hosted end to end. Additional OAuth providers can
// be added to the `providers` array without changing anything else.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPlatformAdmin: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    isPlatformAdmin?: boolean;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Dev previews run inside a cross-site iframe (v0.app), where browsers drop
// SameSite=Lax cookies, so every navigation after login looked signed out.
// In development only, issue SameSite=None; Secure cookies (localhost is
// treated as a secure context, so plain http://localhost still works).
const isDev = process.env.NODE_ENV === "development";
const iframeCookieOptions = {
  httpOnly: true,
  sameSite: "none" as const,
  path: "/",
  secure: true,
};
const devCookies = isDev
  ? {
      sessionToken: {
        name: "__Secure-authjs.session-token",
        options: iframeCookieOptions,
      },
      callbackUrl: {
        name: "__Secure-authjs.callback-url",
        options: iframeCookieOptions,
      },
      csrfToken: {
        name: "__Host-authjs.csrf-token",
        options: iframeCookieOptions,
      },
    }
  : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.authSecret,
  session: { strategy: "jwt" },
  ...(isDev ? { useSecureCookies: true, cookies: devCookies } : {}),
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user || !user.hashedPassword) return null;

        const ok = await bcrypt.compare(password, user.hashedPassword);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isPlatformAdmin: user.isPlatformAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isPlatformAdmin = (user as { isPlatformAdmin?: boolean }).isPlatformAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isPlatformAdmin = Boolean(token.isPlatformAdmin);
      }
      return session;
    },
  },
});

// Convenience: throw if there is no session (used by server actions).
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHENTICATED");
  }
  return session.user;
}
