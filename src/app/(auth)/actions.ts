"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { slugify } from "@/lib/utils";

export type AuthState = { error?: string } | undefined;

export async function authenticate(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      redirectTo: "/app",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    // signIn throws a redirect on success — let it propagate.
    throw error;
  }
  return undefined;
}

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  accountType: z.enum(["individual", "organization"]),
  orgName: z.string().max(120).optional(),
  asTasker: z.boolean().optional(),
});

export async function registerUser(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    accountType: formData.get("accountType"),
    orgName: formData.get("orgName") || undefined,
    asTasker: formData.get("asTasker") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with that email already exists." };
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: data.name,
          hashedPassword: await hashPassword(data.password),
        },
      });

      if (data.asTasker) {
        await tx.taskerProfile.create({
          data: { userId: user.id, headline: `${data.name}` },
        });
      }

      if (data.accountType === "organization" && data.orgName) {
        // Ensure a unique slug for the new entity.
        const base = slugify(data.orgName) || "org";
        let slug = base;
        let n = 1;
        while (await tx.entity.findUnique({ where: { slug } })) {
          slug = `${base}-${n++}`;
        }
        const entity = await tx.entity.create({
          data: { name: data.orgName, slug, billingEmail: email },
        });
        await tx.membership.create({
          data: { userId: user.id, entityId: entity.id, role: "OWNER" },
        });
        await tx.subscription.create({
          data: { entityId: entity.id, tier: "FREE", status: "TRIALING" },
        });
      } else {
        await tx.subscription.create({
          data: { ownerUserId: user.id, tier: "FREE", status: "TRIALING" },
        });
      }
    });
  } catch {
    return { error: "Could not create your account. Please try again." };
  }

  // Created — sign in (throws a redirect to /app on success).
  await signIn("credentials", {
    email,
    password: data.password,
    redirectTo: "/app",
  });
  return undefined;
}
