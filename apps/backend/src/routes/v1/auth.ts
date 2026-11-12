import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/auth";
import { AuditLog, Doctor, OTPRequest, Patient, User } from "../../models";
import { createSession, newTestOtp, otpDigest, readSessionCookie, revokeSession, setSessionCookie, verifyOtpHash, clearSessionCookie } from "../../services/auth";

export const authRouter = Router();
const otpRequestLimiter = rateLimit({ windowMs: 15 * 60_000, limit: env.MOCK_OTP ? 30 : 5, standardHeaders: "draft-8", legacyHeaders: false });
const otpVerifyLimiter = rateLimit({ windowMs: 15 * 60_000, limit: env.MOCK_OTP ? 60 : 10, standardHeaders: "draft-8", legacyHeaders: false });
const mobileSchema = z.string().regex(/^\+?[1-9]\d{9,14}$/);
authRouter.post("/patient/otp", otpRequestLimiter, async (req, res, next) => {
  try {
    if (!env.MOCK_OTP || env.APP_ENV === "production") { res.status(503).json({ error: { code: "OTP_PROVIDER_NOT_CONFIGURED", message: "Configure an SMS provider before enabling patient sign-in." } }); return; }
    const parsed = z.object({ mobile: mobileSchema }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: { code: "INVALID_MOBILE", message: "Enter a valid mobile number." } }); return; }
    const mobile = parsed.data.mobile.startsWith("+") ? parsed.data.mobile : `+91${parsed.data.mobile}`;
    const code = newTestOtp(mobile);
    await OTPRequest.updateMany({ mobile, purpose: "login", consumedAt: { $exists: false } }, { $set: { consumedAt: new Date() } });
    await OTPRequest.create({ mobile, purpose: "login", codeHash: otpDigest(mobile, code), expiresAt: new Date(Date.now() + 5 * 60_000), attempts: 0 });
    res.json({ ok: true, debugCode: code });
  } catch (error) { next(error); }
});

authRouter.post("/patient/verify", otpVerifyLimiter, async (req, res, next) => {
  try {
    const parsed = z.object({ mobile: mobileSchema, code: z.string().regex(/^\d{6}$/), givenName: z.string().trim().min(1).max(80).optional(), familyName: z.string().trim().max(80).optional() }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: { code: "INVALID_INPUT", message: "Check the mobile number and six-digit code." } }); return; }
    const mobile = parsed.data.mobile.startsWith("+") ? parsed.data.mobile : `+91${parsed.data.mobile}`;
    const otp = await OTPRequest.findOne({ mobile, purpose: "login", consumedAt: { $exists: false }, expiresAt: { $gt: new Date() } }).select("+codeHash").sort({ createdAt: -1 });
    if (!otp || otp.attempts >= 5 || !verifyOtpHash(mobile, parsed.data.code, otp.codeHash)) {
      if (otp) { otp.attempts += 1; await otp.save(); }
      res.status(401).json({ error: { code: "OTP_INVALID", message: "The code is invalid or expired." } }); return;
    }
    otp.consumedAt = new Date(); await otp.save();
    let user = await User.findOne({ mobile });
    if (!user) user = await User.create({ mobile, role: "patient", status: "active" });
    if (user.role !== "patient" || user.status !== "active") { res.status(403).json({ error: { code: "ACCOUNT_UNAVAILABLE", message: "This account cannot sign in here." } }); return; }
    let patient = await Patient.findOne({ userId: user._id });
    if (!patient) patient = await Patient.create({ userId: user._id, givenName: parsed.data.givenName || "Test patient", familyName: parsed.data.familyName || "" });
    await createSession(user._id, res);
    res.json({ ok: true, patient: { id: patient._id, givenName: patient.givenName, familyName: patient.familyName } });
  } catch (error) { next(error); }
});

async function staffLogin(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction, role: "doctor" | "admin") {
  try {
    const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: { code: "INVALID_INPUT", message: "Enter your work email and password." } }); return; }
    const user = await User.findOne({ email: parsed.data.email.toLowerCase(), role, status: "active" }).select("+passwordHash");
    const bcrypt = await import("bcryptjs");
    if (!user?.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) { res.status(401).json({ error: { code: "LOGIN_FAILED", message: "Email or password is incorrect." } }); return; }
    await createSession(user._id, res);
    res.json({ ok: true, role });
  } catch (error) { next(error); }
}
authRouter.post("/doctor/login", (req, res, next) => void staffLogin(req, res, next, "doctor"));
authRouter.post("/admin/login", (req, res, next) => void staffLogin(req, res, next, "admin"));
authRouter.get("/session", requireAuth, async (_req, res) => {
  const actor = res.locals.actor;
  res.json({ ok: true, user: { id: actor.userId, role: actor.role, mobile: actor.mobile, email: actor.email } });
});
authRouter.post("/logout", async (req, res, next) => {
  try { const token = readSessionCookie(req); if (token) await revokeSession(token); clearSessionCookie(res); res.json({ ok: true }); } catch (error) { next(error); }
});
