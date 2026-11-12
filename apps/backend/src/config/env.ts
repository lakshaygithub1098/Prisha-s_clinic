import dotenv from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

// Resolve the root env file from this source location so loading works whether
// pnpm starts the package or Node is launched directly. A package-local .env
// remains available as a fallback for isolated local development.
dotenv.config({ path: resolve(__dirname, "../../../../.env") });
dotenv.config();

const deploymentDefault = process.env.VERCEL_ENV === "preview"
  ? "preview"
  : process.env.VERCEL_ENV === "production"
    ? "production"
    : process.env.NODE_ENV || (process.env.VERCEL ? "production" : "development");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default(process.env.VERCEL ? "production" : "development"),
  APP_ENV: z.enum(["development", "test", "preview", "production"]).default(deploymentDefault as "development" | "test" | "preview" | "production"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  HOST: z.string().min(1).optional(),
  MONGODB_URI: z.string().trim().optional().transform((value) => value || undefined),
  MONGODB_DATABASE: z.string().trim().min(1).default("prisha_clinic_test"),
  OTP_PEPPER: z.string().min(32).optional(),
  MOCK_OTP: z.enum(["true", "false"]).default(deploymentDefault === "production" ? "false" : "true").transform((value) => value === "true"),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:4000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid backend environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.MONGODB_URI && !/^mongodb(?:\+srv)?:\/\//i.test(parsed.data.MONGODB_URI)) {
  console.error("Invalid backend environment configuration: MONGODB_URI must use mongodb:// or mongodb+srv://.");
  process.exit(1);
}

if (parsed.data.APP_ENV === "production" && (parsed.data.MOCK_OTP || parsed.data.MONGODB_DATABASE === "prisha_clinic_test" || !parsed.data.OTP_PEPPER)) {
  console.error("Production requires a non-test MongoDB database, OTP_PEPPER, and MOCK_OTP=false.");
  process.exit(1);
}

export const env = {
  ...parsed.data,
  HOST: parsed.data.HOST ?? (parsed.data.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"),
  CORS_ORIGINS: parsed.data.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
};
