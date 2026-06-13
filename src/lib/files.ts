import { createHash } from "node:crypto";
import type { FileScope } from "@prisma/client";
import { prisma } from "@/lib/db";
import { storage, buildStorageKey } from "@/lib/storage";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per file

// Persists an uploaded File to the configured storage driver and records a
// StoredFile row. Shared by the create-task action and the upload route so the
// validation and storage logic live in exactly one place.
export async function storeUploadedFile(opts: {
  file: File;
  uploaderId: string;
  taskId?: string | null;
  fieldId?: string | null;
  deliverableId?: string | null;
  scope: FileScope;
}) {
  const { file } = opts;
  if (file.size === 0) throw new Error("Empty file");
  if (file.size > MAX_BYTES) throw new Error("File exceeds 25 MB limit");

  const buffer = Buffer.from(await file.arrayBuffer());
  const checksum = createHash("sha256").update(buffer).digest("hex");
  const key = buildStorageKey({ taskId: opts.taskId, filename: file.name });

  await storage().put(key, buffer, file.type || "application/octet-stream");

  return prisma.storedFile.create({
    data: {
      storageKey: key,
      filename: file.name.slice(0, 200),
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      checksum,
      scope: opts.scope,
      taskId: opts.taskId ?? null,
      fieldId: opts.fieldId ?? null,
      deliverableId: opts.deliverableId ?? null,
      uploaderId: opts.uploaderId,
    },
  });
}
