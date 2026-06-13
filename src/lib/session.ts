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

// Returns the bare viewer (id + admin flag) or null. Cheap — uses the session.
export async function getViewer(): Promise<Viewer | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, isPlatformAdmin: session.user.isPlatformAdmin };
}

// Loads the full context used to build navigation and gate role areas.
export async function getViewerContext(): Promise<ViewerContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      taskerProfile: { select: { id: true } },
      memberships: { include: { entity: true } },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isPlatformAdmin: user.isPlatformAdmin,
    isTasker: Boolean(user.taskerProfile),
    entities: user.memberships.map((m) => ({
      id: m.entity.id,
      name: m.entity.name,
      slug: m.entity.slug,
      role: m.role,
      isManager: m.role === "OWNER" || m.role === "ADMIN",
    })),
  };
}

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
