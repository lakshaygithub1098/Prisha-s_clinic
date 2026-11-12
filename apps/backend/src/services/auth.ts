import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { env } from "../config/env";
import { Patient, Session, User } from "../models";

export const SESSION_COOKIE = "prisha_session";
const sessionDurationMs = 12 * 60 * 60 * 1000;
const otpPepper = env.OTP_PEPPER || "local-test-only-otp-pepper";

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function hashOtp(mobile: string, code: string): string {
  return createHmac("sha256", otpPepper).update(`${mobile}:${code}`).digest("hex");
}

export function verifyOtpHash(mobile: string, code: string, expected: string): boolean {
  const provided = Buffer.from(hashOtp(mobile, code), "hex");
  const stored = Buffer.from(expected, "hex");
  return provided.length === stored.length && timingSafeEqual(provided, stored);
}

export function readSessionCookie(req: Request): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  const entry = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(SESSION_COOKIE.length + 1)) : undefined;
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: sessionDurationMs,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
}

export async function createSession(userId: mongoose.Types.ObjectId, res: Response): Promise<void> {
  const rawToken = randomBytes(32).toString("base64url");
  await Session.create({ tokenHash: hashOpaqueToken(rawToken), userId, expiresAt: new Date(Date.now() + sessionDurationMs) });
  setSessionCookie(res, rawToken);
}

export function newTestOtp(mobile: string): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function otpDigest(mobile: string, code: string): string {
  return hashOtp(mobile, code);
}

export async function authenticateToken(rawToken: string) {
  const session = await Session.findOne({
    tokenHash: hashOpaqueToken(rawToken),
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).select("+tokenHash");
  if (!session) return null;

  const user = await User.findById(session.userId).select("role status mobile email");
  if (!user || user.status !== "active") return null;

  const patient = user.role === "patient" ? await Patient.findOne({ userId: user._id }).select("_id") : null;
  return {
    userId: user._id,
    role: user.role,
    patientId: patient?._id,
    email: user.email,
    mobile: user.mobile,
  };
}

export async function revokeSession(rawToken: string): Promise<void> {
  await Session.updateOne({ tokenHash: hashOpaqueToken(rawToken) }, { $set: { revokedAt: new Date() } });
}
