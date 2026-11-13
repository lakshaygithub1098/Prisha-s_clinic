import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { Patient, User } from "../../models";
import { createSession, readSessionCookie, revokeSession, clearSessionCookie } from "../../services/auth";
import { writeAudit } from "../../services/audit";
import bcrypt from "bcryptjs";

export const authRouter = Router();
const patientAuthLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });
const patientProfileSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(72),
  givenName: z.string().trim().min(1).max(80),
  familyName: z.string().trim().max(80).optional(),
});

authRouter.post("/patient/register", patientAuthLimiter, async (req, res, next) => {
  try {
    const parsed = patientProfileSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: { code: "INVALID_INPUT", message: "Enter a valid email, your name, and a password of at least 12 characters." } }); return; }
    if (Buffer.byteLength(parsed.data.password, "utf8") > 72) { res.status(400).json({ error: { code: "INVALID_PASSWORD", message: "Password must be no longer than 72 bytes." } }); return; }
    if (await User.exists({ email: parsed.data.email })) { res.status(409).json({ error: { code: "EMAIL_IN_USE", message: "An account with this email already exists. Sign in instead." } }); return; }
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await User.create({ email: parsed.data.email, role: "patient", status: "active", passwordHash });
    const patient = await Patient.create({ userId: user._id, givenName: parsed.data.givenName, familyName: parsed.data.familyName || "" });
    await createSession(user._id, res);
    await writeAudit(req, res, { action: "patient.register", resourceType: "patient", resourceId: patient._id, outcome: "success" });
    res.status(201).json({ ok: true, patient: { id: patient._id, givenName: patient.givenName, familyName: patient.familyName } });
  } catch (error) { next(error); }
});

authRouter.post("/patient/login", patientAuthLimiter, async (req, res, next) => {
  try {
    const parsed = z.object({ email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()), password: z.string().min(1).max(72) }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: { code: "INVALID_INPUT", message: "Enter a valid email and password." } }); return; }
    const user = await User.findOne({ email: parsed.data.email, role: "patient", status: "active" }).select("+passwordHash");
    if (!user?.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      await writeAudit(req, res, { action: "patient.login", resourceType: "user", outcome: "denied", reason: "invalid_credentials" });
      res.status(401).json({ error: { code: "LOGIN_FAILED", message: "Email or password is incorrect." } }); return;
    }
    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) { res.status(403).json({ error: { code: "PATIENT_PROFILE_MISSING", message: "Patient profile is unavailable. Contact the clinic." } }); return; }
    user.lastLoginAt = new Date(); await user.save();
    await createSession(user._id, res);
    await writeAudit(req, res, { action: "patient.login", resourceType: "patient", resourceId: patient._id, outcome: "success" });
    res.json({ ok: true, patient: { id: patient._id, givenName: patient.givenName, familyName: patient.familyName } });
  } catch (error) { next(error); }
});

async function staffLogin(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction, role: "doctor" | "admin") {
  try {
    const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: { code: "INVALID_INPUT", message: "Enter your work email and password." } }); return; }
    const user = await User.findOne({ email: parsed.data.email.toLowerCase(), role, status: "active" }).select("+passwordHash");
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
