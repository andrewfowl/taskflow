// A minimal storage contract. Anything that can store and return bytes by key
// satisfies it, so we can run on local disk, MinIO, Cloudflare R2, AWS S3, etc.
// without changing application code.
export interface StorageDriver {
  readonly name: string;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  // Optional: direct, time-limited URL (S3 presign). Drivers that can't do
  // this return null and the app streams bytes through its own route handler.
  signedUrl?(key: string, expiresInSeconds: number): Promise<string | null>;
}
