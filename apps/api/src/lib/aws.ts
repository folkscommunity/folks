import { S3Client } from "@aws-sdk/client-s3";

if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  console.warn(
    "R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are not set, some features will not work."
  );
}

if (!process.env.R2_ACCOUNT_ID) {
  console.warn("R2_ACCOUNT_ID is not set, some features will not work.");
}

export const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});
