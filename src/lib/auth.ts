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

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.authSecret,
  session: { strategy: "jwt" },
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
