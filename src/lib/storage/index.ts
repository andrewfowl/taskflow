import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import type { StorageDriver } from "./types";
import { LocalStorageDriver } from "./local";
import { S3StorageDriver } from "./s3";

let cached: StorageDriver | null = null;

// Picks the concrete driver from configuration. Swapping providers is purely
// an environment-variable change — no code edits required.
export function storage(): StorageDriver {
  if (cached) return cached;
  if (env.storage.driver === "s3") {
    cached = new S3StorageDriver(env.storage.s3);
  } else {
    cached = new LocalStorageDriver(env.storage.localDir);
  }
  return cached;
}

// Generates a collision-free, non-guessable storage key. We namespace by task
// so files are easy to locate and lifecycle in the bucket.
export function buildStorageKey(opts: {
  taskId?: string | null;
  filename: string;
}): string {
  const safeName = opts.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const prefix = opts.taskId ? `tasks/${opts.taskId}` : "misc";
  return `${prefix}/${randomUUID()}-${safeName}`;
}

export type { StorageDriver } from "./types";
