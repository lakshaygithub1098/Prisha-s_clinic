import mongoose, { Schema, Types } from "mongoose";

const { ObjectId } = Schema.Types;
const timestamps = { timestamps: true, strict: "throw" as const };

const userSchema: Schema = new Schema({
  role: { type: String, enum: ["patient", "doctor", "admin", "reception"], required: true, index: true },
  status: { type: String, enum: ["active", "disabled", "pending"], default: "active", index: true },
  mobile: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  passwordHash: { type: String, select: false },
  lastLoginAt: Date,
}, timestamps);
userSchema.index({ mobile: 1 }, { unique: true, partialFilterExpression: { mobile: { $type: "string" } } });
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });

const patientSchema: Schema = new Schema({
  userId: { type: ObjectId, ref: "User", required: true, unique: true },
  givenName: { type: String, trim: true, required: true },
  familyName: { type: String, trim: true },
  dateOfBirth: Date,
  preferredName: String,
  preferredLanguage: String,
}, timestamps);

const specialitySchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, lowercase: true, unique: true },
  publicDescription: String,
  active: { type: Boolean, default: true, index: true },
}, timestamps);

const doctorSchema: Schema = new Schema({
  userId: { type: ObjectId, ref: "User", required: true, unique: true },
  specialityIds: [{ type: ObjectId, ref: "Speciality" }],
  displayName: { type: String, required: true, trim: true },
  publicProfile: {
    biography: String,
    qualifications: [String],
    achievements: [String],
    experienceText: String,
    areasOfExpertise: [String],
    photoStorageKey: String,
    approvedAt: Date,
  },
  active: { type: Boolean, default: true, index: true },
}, timestamps);
doctorSchema.index({ specialityIds: 1, active: 1 });

const scheduleSchema: Schema = new Schema({
  doctorId: { type: ObjectId, ref: "Doctor", required: true },
  dayOfWeek: { type: Number, min: 0, max: 6, required: true },
  startMinute: { type: Number, min: 0, max: 1439, required: true },
  endMinute: { type: Number, min: 1, max: 1440, required: true },
  slotDurationMinutes: { type: Number, min: 5, max: 240, required: true },
  bufferMinutes: { type: Number, min: 0, max: 240, default: 0 },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: Date,
  timezone: { type: String, default: "Asia/Kolkata" },
  active: { type: Boolean, default: true },
}, timestamps);
scheduleSchema.index({ doctorId: 1, dayOfWeek: 1, effectiveFrom: 1, effectiveTo: 1 });

const scheduleExceptionSchema: Schema = new Schema({
  doctorId: { type: ObjectId, ref: "Doctor", required: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  kind: { type: String, enum: ["closed", "override"], required: true },
  reason: String,
  overrideStartMinute: Number,
  overrideEndMinute: Number,
}, timestamps);
scheduleExceptionSchema.index({ doctorId: 1, startsAt: 1, endsAt: 1 });

const appointmentSlotSchema: Schema = new Schema({
  doctorId: { type: ObjectId, ref: "Doctor", required: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  state: { type: String, enum: ["open", "held", "booked", "blocked"], default: "open", required: true },
  appointmentId: { type: ObjectId, ref: "Appointment" },
}, timestamps);
appointmentSlotSchema.index({ doctorId: 1, startsAt: 1 }, { unique: true });
appointmentSlotSchema.index({ doctorId: 1, state: 1, startsAt: 1 });

const appointmentSchema: Schema = new Schema({
  patientId: { type: ObjectId, ref: "Patient", required: true, index: true },
  doctorId: { type: ObjectId, ref: "Doctor", required: true, index: true },
  specialityId: { type: ObjectId, ref: "Speciality", required: true },
  slotIds: [{ type: ObjectId, ref: "AppointmentSlot", required: true }],
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  timezone: { type: String, default: "Asia/Kolkata" },
  source: { type: String, enum: ["online", "phone", "walk_in"], required: true },
  status: { type: String, enum: ["pending", "confirmed", "checked_in", "in_consultation", "completed", "cancelled", "no_show"], default: "confirmed", index: true },
  createdByUserId: { type: ObjectId, ref: "User", required: true },
  cancellation: { cancelledAt: Date, cancelledByUserId: ObjectId, reason: String },
  rescheduledFromId: { type: ObjectId, ref: "Appointment" },
}, timestamps);
appointmentSchema.index({ doctorId: 1, startsAt: 1 });
appointmentSchema.index({ patientId: 1, startsAt: -1 });
appointmentSchema.index({ doctorId: 1, status: 1, startsAt: 1 });
appointmentSchema.index({ status: 1, startsAt: 1 });

const consultationSchema: Schema = new Schema({
  appointmentId: { type: ObjectId, ref: "Appointment", required: true, unique: true },
  patientId: { type: ObjectId, ref: "Patient", required: true, index: true },
  doctorId: { type: ObjectId, ref: "Doctor", required: true, index: true },
  chiefConcern: String,
  notes: { type: String, select: false },
  assessment: { type: String, select: false },
  plan: { type: String, select: false },
  status: { type: String, enum: ["draft", "finalized", "amended"], default: "draft", index: true },
  finalizedAt: Date,
  finalizedByUserId: { type: ObjectId, ref: "User" },
  amendedFromId: { type: ObjectId, ref: "Consultation" },
}, timestamps);

const prescriptionSchema: Schema = new Schema({
  consultationId: { type: ObjectId, ref: "Consultation", required: true, index: true },
  patientId: { type: ObjectId, ref: "Patient", required: true, index: true },
  doctorId: { type: ObjectId, ref: "Doctor", required: true, index: true },
  version: { type: Number, min: 1, required: true },
  instructions: String,
  status: { type: String, enum: ["draft", "finalized", "void"], default: "draft", index: true },
  pdfStorageKey: String,
  finalizedAt: Date,
}, timestamps);
prescriptionSchema.index({ consultationId: 1, version: 1 }, { unique: true });
prescriptionSchema.index({ patientId: 1, createdAt: -1 });

const prescriptionItemSchema: Schema = new Schema({
  prescriptionId: { type: ObjectId, ref: "Prescription", required: true },
  order: { type: Number, min: 0, required: true },
  medicine: { type: String, required: true, trim: true },
  dose: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  instructions: String,
}, timestamps);
prescriptionItemSchema.index({ prescriptionId: 1, order: 1 }, { unique: true });

const medicalRecordSchema: Schema = new Schema({
  patientId: { type: ObjectId, ref: "Patient", required: true, index: true },
  uploadedByUserId: { type: ObjectId, ref: "User", required: true },
  category: { type: String, enum: ["lab_result", "imaging", "referral", "other"], required: true },
  displayName: { type: String, required: true },
  storageKey: { type: String, required: true, select: false },
  mimeType: { type: String, required: true },
  sizeBytes: { type: Number, min: 0, required: true },
  patientVisible: { type: Boolean, default: false, index: true },
  recordedAt: Date,
}, timestamps);
medicalRecordSchema.index({ patientId: 1, createdAt: -1 });

const notificationSchema: Schema = new Schema({
  recipientUserId: { type: ObjectId, ref: "User", required: true, index: true },
  channel: { type: String, enum: ["sms", "email", "in_app"], required: true },
  template: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, select: false },
  status: { type: String, enum: ["queued", "sent", "failed"], default: "queued", index: true },
  nextAttemptAt: Date,
  sentAt: Date,
}, timestamps);
notificationSchema.index({ status: 1, nextAttemptAt: 1 });

const otpRequestSchema: Schema = new Schema({
  mobile: { type: String, required: true, index: true },
  codeHash: { type: String, required: true, select: false },
  purpose: { type: String, enum: ["login", "registration"], required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, min: 0, default: 0 },
  consumedAt: Date,
  requestIpHash: { type: String, select: false },
}, { ...timestamps, collection: "otpRequests" });
otpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpRequestSchema.index({ mobile: 1, purpose: 1, createdAt: -1 });

const sessionSchema: Schema = new Schema({
  tokenHash: { type: String, required: true, unique: true, select: false },
  userId: { type: ObjectId, ref: "User", required: true, index: true },
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
}, { ...timestamps, collection: "sessions" });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const auditLogSchema: Schema = new Schema({
  actorUserId: { type: ObjectId, ref: "User", index: true },
  action: { type: String, required: true },
  resourceType: { type: String, required: true },
  resourceId: { type: ObjectId },
  outcome: { type: String, enum: ["success", "denied", "failure"], required: true },
  reason: String,
  requestId: String,
  ipHash: String,
  metadata: { type: Schema.Types.Mixed, select: false },
}, { ...timestamps, collection: "auditLogs" });
auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ actorUserId: 1, createdAt: -1 });

const patientConsentSchema: Schema = new Schema({
  patientId: { type: ObjectId, ref: "Patient", required: true, index: true },
  consentType: { type: String, required: true },
  version: { type: String, required: true },
  status: { type: String, enum: ["granted", "withdrawn"], required: true },
  capturedAt: { type: Date, required: true },
  withdrawnAt: Date,
  source: { type: String, enum: ["portal", "admin", "paper"], required: true },
}, timestamps);
patientConsentSchema.index({ patientId: 1, consentType: 1, createdAt: -1 });

function getModel(name: string, schema: Schema): mongoose.Model<any> {
  return (mongoose.models[name] as mongoose.Model<any> | undefined) ?? mongoose.model(name, schema);
}

export const User = getModel("User", userSchema);
export const Patient = getModel("Patient", patientSchema);
export const Speciality = getModel("Speciality", specialitySchema);
export const Doctor = getModel("Doctor", doctorSchema);
export const Schedule = getModel("Schedule", scheduleSchema);
export const ScheduleException = getModel("ScheduleException", scheduleExceptionSchema);
export const AppointmentSlot = getModel("AppointmentSlot", appointmentSlotSchema);
export const Appointment = getModel("Appointment", appointmentSchema);
export const Consultation = getModel("Consultation", consultationSchema);
export const Prescription = getModel("Prescription", prescriptionSchema);
export const PrescriptionItem = getModel("PrescriptionItem", prescriptionItemSchema);
export const MedicalRecord = getModel("MedicalRecord", medicalRecordSchema);
export const Notification = getModel("Notification", notificationSchema);
export const OTPRequest = getModel("OTPRequest", otpRequestSchema);
export const Session = getModel("Session", sessionSchema);
export const AuditLog = getModel("AuditLog", auditLogSchema);
export const PatientConsent = getModel("PatientConsent", patientConsentSchema);

export type Id = Types.ObjectId;
