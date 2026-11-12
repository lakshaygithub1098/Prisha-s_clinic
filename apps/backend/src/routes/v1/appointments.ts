import { Router } from "express";
import mongoose, { Types } from "mongoose";
import { z } from "zod";
import { requireAuth, requireRoles, getActor } from "../../middleware/auth";
import { Appointment, AppointmentSlot, Doctor, Patient, Schedule, Speciality } from "../../models";
import { writeAudit } from "../../services/audit";

export const appointmentsRouter = Router();
appointmentsRouter.get("/specialities", async (_req, res, next) => {
  try { res.json({ specialities: await Speciality.find({ active: true }).select("name slug publicDescription").lean() }); } catch (e) { next(e); }
});
appointmentsRouter.get("/doctors", async (req, res, next) => {
  try {
    const specialityValue = req.query.specialityId ? String(req.query.specialityId) : undefined;
    if (specialityValue && !Types.ObjectId.isValid(specialityValue)) { res.status(400).json({ error: { code: "INVALID_SPECIALITY", message: "Select a valid speciality." } }); return; }
    const specialityId = specialityValue ? new Types.ObjectId(specialityValue) : undefined;
    const query: Record<string, unknown> = { active: true };
    if (specialityId) query.specialityIds = specialityId;
    const doctors = await Doctor.find(query).select("displayName specialityIds").lean();
    res.json({ doctors });
  } catch (e) { next(e); }
});
appointmentsRouter.get("/availability", async (req, res, next) => {
  try {
    const doctorId = String(req.query.doctorId || "");
    const day = String(req.query.date || "");
    if (!Types.ObjectId.isValid(doctorId) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) { res.status(400).json({ error: { code: "INVALID_QUERY", message: "Select a doctor and date." } }); return; }
    const parts = day.split("-").map(Number);
    const year = parts[0]!; const month = parts[1]!; const date = parts[2]!;
    if (new Date(Date.UTC(year, month - 1, date)).toISOString().slice(0, 10) !== day) { res.status(400).json({ error: { code: "INVALID_DATE", message: "Select a valid date." } }); return; }
    const weekday = new Date(Date.UTC(year, month - 1, date)).getUTCDay();
    const schedules = await Schedule.find({ doctorId, dayOfWeek: weekday, active: true, effectiveFrom: { $lte: new Date(`${day}T00:00:00+05:30`) }, $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: { $gte: new Date(`${day}T23:59:59+05:30`) } }] }).lean();
    const slots: Array<{ startsAt: string; endsAt: string }> = [];
    const now = Date.now();
    for (const schedule of schedules) for (let minute = schedule.startMinute; minute + schedule.slotDurationMinutes <= schedule.endMinute; minute += schedule.slotDurationMinutes + schedule.bufferMinutes) {
      const local = `${day}T${String(Math.floor(minute / 60)).padStart(2,"0")}:${String(minute % 60).padStart(2,"0")}:00+05:30`;
      const startsAt = new Date(local); const endsAt = new Date(startsAt.getTime() + schedule.slotDurationMinutes * 60000);
      if (startsAt.getTime() <= now) continue;
      let existing;
      try {
        existing = await AppointmentSlot.findOneAndUpdate({ doctorId, startsAt }, { $setOnInsert: { doctorId, startsAt, endsAt, state: "open" } }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }).lean();
      } catch (error: any) {
        if (error?.code !== 11000) throw error;
        existing = await AppointmentSlot.findOne({ doctorId, startsAt }).lean();
      }
      if (existing?.state === "open") slots.push({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() });
    }
    res.json({ slots });
  } catch (e) { next(e); }
});

appointmentsRouter.post("/", requireAuth, requireRoles("patient"), async (req, res, next) => {
  const parsed = z.object({ doctorId: z.string().refine(Types.ObjectId.isValid), specialityId: z.string().refine(Types.ObjectId.isValid), startsAt: z.string().datetime() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: { code: "INVALID_INPUT", message: "Select a valid doctor, speciality and available time." } }); return; }
  const actor = getActor(res);
  if (!actor.patientId) { res.status(403).json({ error: { code: "PATIENT_PROFILE_REQUIRED", message: "Patient profile is not available." } }); return; }
  const startsAt = new Date(parsed.data.startsAt);
  const session = await mongoose.startSession();
  try {
    let result: any;
    await session.withTransaction(async () => {
      const doctor = await Doctor.findOne({ _id: parsed.data.doctorId, active: true, specialityIds: parsed.data.specialityId }).session(session);
      const speciality = await Speciality.findOne({ _id: parsed.data.specialityId, active: true }).session(session);
      if (!doctor || !speciality) throw Object.assign(new Error("The selected doctor or speciality is unavailable."), { status: 404 });
      const slot = await AppointmentSlot.findOneAndUpdate({ doctorId: doctor._id, startsAt, state: "open" }, { $set: { state: "held" } }, { new: true, session });
      if (!slot) throw Object.assign(new Error("That time was just taken. Choose another available time."), { status: 409 });
      const [appointment] = await Appointment.create([{ patientId: actor.patientId, doctorId: doctor._id, specialityId: speciality._id, slotIds: [slot._id], startsAt: slot.startsAt, endsAt: slot.endsAt, timezone: "Asia/Kolkata", source: "online", status: "confirmed", createdByUserId: actor.userId }], { session });
      slot.state = "booked"; slot.appointmentId = appointment._id; await slot.save({ session });
      result = { id: appointment._id, startsAt: appointment.startsAt, endsAt: appointment.endsAt, status: appointment.status, doctor: doctor.displayName, speciality: speciality.name };
    });
    await writeAudit(req, res, { action: "appointment.book", resourceType: "appointment", resourceId: result.id, outcome: "success" });
    res.status(201).json({ appointment: result });
  } catch (error: any) {
    if (error?.code === 11000) { res.status(409).json({ error: { code: "SLOT_TAKEN", message: "That time was just taken. Choose another available time." } }); return; }
    if (error?.status) { res.status(error.status).json({ error: { code: error.status === 409 ? "SLOT_TAKEN" : "NOT_FOUND", message: error.message } }); return; }
    next(error);
  } finally { await session.endSession(); }
});

appointmentsRouter.get("/mine", requireAuth, requireRoles("patient"), async (_req, res, next) => {
  try {
    const actor = getActor(res);
    const appointments = await Appointment.find({ patientId: actor.patientId }).sort({ startsAt: -1 }).populate("doctorId", "displayName").populate("specialityId", "name").lean();
    res.json({ appointments: appointments.map((a: any) => ({ id: a._id, startsAt: a.startsAt, endsAt: a.endsAt, status: a.status, doctor: a.doctorId?.displayName, speciality: a.specialityId?.name })) });
  } catch (e) { next(e); }
});

appointmentsRouter.get("/doctor/dashboard", requireAuth, requireRoles("doctor"), async (_req, res, next) => {
  try {
    const actor = getActor(res);
    const doctor = await Doctor.findOne({ userId: actor.userId, active: true }).select("displayName");
    if (!doctor) { res.status(404).json({ error: { code: "DOCTOR_PROFILE_MISSING", message: "Doctor profile is not configured." } }); return; }
    const now = new Date(); const end = new Date(now); end.setDate(end.getDate() + 30);
    const appointments = await Appointment.find({ doctorId: doctor._id, startsAt: { $gte: now, $lt: end }, status: { $nin: ["cancelled"] } }).sort({ startsAt: 1 }).populate("patientId", "givenName familyName").populate("specialityId", "name").lean();
    res.json({ doctor: doctor.displayName, appointments: appointments.map((a: any) => ({ id: a._id, startsAt: a.startsAt, endsAt: a.endsAt, status: a.status, patient: `${a.patientId?.givenName || "Patient"} ${a.patientId?.familyName || ""}`.trim(), speciality: a.specialityId?.name })) });
  } catch (e) { next(e); }
});
