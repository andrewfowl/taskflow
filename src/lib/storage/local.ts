import { promises as fs } from "node:fs";
import path from "node:path";
import type { StorageDriver } from "./types";

// Stores file bytes on the local filesystem. Ideal for development and for
// single-box self-hosting where an object store is overkill. Keys are treated
// as opaque relative paths under the configured root.
export class LocalStorageDriver implements StorageDriver {
  readonly name = "local";
  private root: string;

  constructor(rootDir: string) {
    this.root = path.resolve(process.cwd(), rootDir);
  }

  private resolve(key: string) {
    // Prevent path traversal: the resolved path must stay under root.
    const target = path.resolve(this.root, key);
    if (!target.startsWith(this.root)) {
      throw new Error("Invalid storage key");
    }
    return target;
  }

  async put(key: string, body: Buffer): Promise<void> {
    const target = this.resolve(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, body);
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { force: true });
  }

  async signedUrl(): Promise<string | null> {
    return null; // local disk has no public URL; stream through the app
  }
}
