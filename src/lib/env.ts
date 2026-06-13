// Centralised, validated environment access. Importing from here (instead of
// reading process.env everywhere) keeps configuration in one place and makes
// the "swap any provider" story explicit.

function optional(key: string): string | undefined {
  const v = process.env[key];
  return v && v.length > 0 ? v : undefined;
}

function required(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (!v) {
    // Don't crash at import time during build; surface a clear error at use.
    return "";
  }
  return v;
}

export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "TaskFlow",
  databaseUrl: required("DATABASE_URL"),
  authSecret: required("AUTH_SECRET", "dev-insecure-secret-change-me"),

  storage: {
    driver: (process.env.STORAGE_DRIVER || "local") as "local" | "s3",
    localDir: process.env.LOCAL_STORAGE_DIR || ".localstorage",
    s3: {
      endpoint: optional("S3_ENDPOINT"),
      region: process.env.S3_REGION || "us-east-1",
      bucket: process.env.S3_BUCKET || "taskflow",
      accessKeyId: optional("S3_ACCESS_KEY_ID"),
      secretAccessKey: optional("S3_SECRET_ACCESS_KEY"),
      forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || "true") === "true",
    },
  },

  payments: {
    driver: (process.env.PAYMENTS_DRIVER || "manual") as "stripe" | "manual",
    stripeSecretKey: optional("STRIPE_SECRET_KEY"),
    stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
    commissionRate: Number(process.env.PLATFORM_COMMISSION_RATE || "0.15"),
  },
} as const;

export type Env = typeof env;
