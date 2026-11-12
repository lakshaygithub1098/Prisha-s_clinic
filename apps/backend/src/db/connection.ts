import mongoose from "mongoose";
import { env } from "../config/env";

mongoose.set("bufferCommands", false);

mongoose.connection.on("connected", () => console.info("MongoDB connected."));
mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected."));
mongoose.connection.on("error", () => console.error("MongoDB connection error."));

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectDatabase(): Promise<boolean> {
  if (!env.MONGODB_URI) {
    console.info("MONGODB_URI is not configured; starting API without database-backed features.");
    return false;
  }

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DATABASE,
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    autoIndex: env.NODE_ENV !== "production",
  });

  return true;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
