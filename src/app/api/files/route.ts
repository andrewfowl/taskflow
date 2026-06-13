import { NextResponse } from "next/server";
import type { FileScope } from "@prisma/client";
import { getViewer } from "@/lib/session";
import { getTaskAccess } from "@/lib/access";
import { storeUploadedFile } from "@/lib/files";

// Multipart upload endpoint. Attaches a file to a task after verifying the
// caller may contribute to it. Most uploads go through the create-task server
// action; this exists for incremental uploads and integrations.
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const taskId = String(form.get("taskId") || "");
  const fieldId = String(form.get("fieldId") || "") || null;
  const scope = (String(form.get("scope") || "REFERENCE") as FileScope) || "REFERENCE";

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!taskId) return NextResponse.json({ error: "Missing taskId" }, { status: 400 });

  const access = await getTaskAccess(viewer, taskId);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Requestors may add inputs; producers/admins may add deliverables/attachments.
  const wantsDeliverable = scope === "TASKER_DELIVERABLE";
  const permitted = wantsDeliverable ? access.canSubmitWork : access.canAccessInputFiles;
  if (!permitted) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const stored = await storeUploadedFile({
      file,
      uploaderId: viewer.id,
      taskId,
      fieldId,
      scope,
    });
    return NextResponse.json({ id: stored.id, filename: stored.filename, size: stored.size });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
