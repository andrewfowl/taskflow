import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Viewer } from "@/lib/access";

export type EntityContext = {
  id: string;
  name: string;
  slug: string;
  role: string;
  isManager: boolean;
};

export type ViewerContext = {
  id: string;
  name: string | null;
  email: string;
  isPlatformAdmin: boolean;
  isTasker: boolean;
  entities: EntityContext[];
};

// Both lookups are wrapped in React `cache()` so the layout and the page share
// one result per request instead of each hitting the session and database.
// The cache lives only for a single render, so permission changes apply on the
// very next request.

// Returns the bare viewer (id + admin flag) or null. Cheap — uses the session.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, isPlatformAdmin: session.user.isPlatformAdmin };
});

// Loads the full context used to build navigation and gate role areas.
export const getViewerContext = cache(
  async (): Promise<ViewerContext | null> => {
    const session = await auth();
    if (!session?.user?.id) return null;
    const userId = session.user.id;

    // A nested `include` makes Prisma run its sub-queries one after another;
    // issuing them together costs one round trip instead of several.
    const [user, taskerProfile, memberships] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, isPlatformAdmin: true },
      }),
      prisma.taskerProfile.findUnique({
        where: { userId },
        select: { id: true },
      }),
      prisma.membership.findMany({
        where: { userId },
        select: {
          role: true,
          entity: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
      isTasker: Boolean(taskerProfile),
      entities: memberships.map((m) => ({
        id: m.entity.id,
        name: m.entity.name,
        slug: m.entity.slug,
        role: m.role,
        isManager: m.role === "OWNER" || m.role === "ADMIN",
      })),
    };
  },
);

// Use at the top of every protected page/action.
export async function requireViewer(): Promise<Viewer> {
  const v = await getViewer();
  if (!v) redirect("/login");
  return v;
}

export async function requireAdmin(): Promise<Viewer> {
  const v = await requireViewer();
  if (!v.isPlatformAdmin) redirect("/app");
  return v;
}
