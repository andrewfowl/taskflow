import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageDriver } from "./types";

type S3Config = {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle: boolean;
};

// Works with any S3-compatible object store: AWS S3, Cloudflare R2, MinIO,
// Backblaze B2, Wasabi, etc. Path-style addressing supports MinIO/R2.
export class S3StorageDriver implements StorageDriver {
  readonly name = "s3";
  private client: S3Client;
  private bucket: string;

  constructor(cfg: S3Config) {
    this.bucket = cfg.bucket;
    this.client = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      forcePathStyle: cfg.forcePathStyle,
      // S3-compatible stores (Cloudflare R2, MinIO, Backblaze B2…) reject the
      // aws-sdk v3 default integrity checksums; only send them when an
      // operation actually requires it.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      credentials:
        cfg.accessKeyId && cfg.secretAccessKey
          ? {
              accessKeyId: cfg.accessKeyId,
              secretAccessKey: cfg.secretAccessKey,
            }
          : undefined,
    });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new Error("Empty object body");
    return Buffer.from(bytes);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async signedUrl(key: string, expiresInSeconds: number): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }
}
