import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getViewer } from "@/lib/session";
import { canAccessFile } from "@/lib/access";
import { storage } from "@/lib/storage";

// Authenticated, access-controlled file download. Bytes are streamed through
// the app only after an ACL check — uploads are never publicly addressable.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  const file = await prisma.storedFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canAccessFile(viewer, file);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // If the driver can mint a time-limited URL (S3), redirect to it.
  const driver = storage();
  if (driver.signedUrl) {
    const url = await driver.signedUrl(file.storageKey, 120);
    if (url) return NextResponse.redirect(url);
  }

  const bytes = await driver.get(file.storageKey);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.size),
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
