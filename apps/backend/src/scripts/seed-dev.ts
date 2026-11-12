import "../config/env";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../db/connection";
import { Doctor, Schedule, Speciality, User } from "../models";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Development seed is disabled in production.");
  if (!(await connectDatabase())) throw new Error("Set MONGODB_URI before seeding the isolated test database.");
  const gynae = await Speciality.findOneAndUpdate({ slug: "test-gynaecology" }, { $setOnInsert: { name: "Test Gynaecology", slug: "test-gynaecology", publicDescription: "Synthetic test speciality", active: true } }, { upsert: true, new: true });
  const thyroid = await Speciality.findOneAndUpdate({ slug: "test-thyroid-care" }, { $setOnInsert: { name: "Test Thyroid Care", slug: "test-thyroid-care", publicDescription: "Synthetic test speciality", active: true } }, { upsert: true, new: true });
  const existingStaff = await User.countDocuments({ email: { $in: ["test.gynae@prisha.local", "test.thyroid@prisha.local", "test.admin@prisha.local"] } });
  const seedPassword = process.env.TEST_ACCOUNT_PASSWORD || (existingStaff === 0 ? randomBytes(12).toString("base64url") : undefined);
  if (existingStaff > 0 && !seedPassword) {
    const missing = await User.countDocuments({ email: { $in: ["test.gynae@prisha.local", "test.thyroid@prisha.local", "test.admin@prisha.local"] } });
    if (missing < 3) throw new Error("Some test staff already exist. Set TEST_ACCOUNT_PASSWORD in .env to reset all seeded accounts consistently.");
  }
  const passwordHash = seedPassword ? await bcrypt.hash(seedPassword, 12) : undefined;
  const accounts = [
    { email: "test.gynae@prisha.local", name: "Test Gynaecology Doctor", speciality: gynae },
    { email: "test.thyroid@prisha.local", name: "Test Thyroid Doctor", speciality: thyroid },
  ];
  const doctorIds = [];
  for (const account of accounts) {
    const existing = await User.findOne({ email: account.email });
    const user = existing || await User.create({ email: account.email, role: "doctor", status: "active", passwordHash });
    if (existing && passwordHash) { user.passwordHash = passwordHash; await user.save(); }
    const doctor = await Doctor.findOneAndUpdate({ userId: user._id }, { $set: { displayName: account.name, specialityIds: [account.speciality._id], active: true }, $setOnInsert: { publicProfile: { biography: "Synthetic test profile", qualifications: [], achievements: [], areasOfExpertise: [] } } }, { upsert: true, new: true });
    doctorIds.push(doctor._id);
    for (const dayOfWeek of [1, 2, 3, 4, 5, 6]) await Schedule.findOneAndUpdate({ doctorId: doctor._id, dayOfWeek, startMinute: 540 }, { $set: { endMinute: 1020, slotDurationMinutes: 30, bufferMinutes: 0, timezone: "Asia/Kolkata", active: true }, $setOnInsert: { effectiveFrom: new Date("2020-01-01T00:00:00+05:30") } }, { upsert: true });
  }
  const adminEmail = "test.admin@prisha.local";
  const admin = await User.findOne({ email: adminEmail });
  if (!admin) await User.create({ email: adminEmail, role: "admin", status: "active", passwordHash });
  else if (passwordHash) { admin.passwordHash = passwordHash; await admin.save(); }
  console.info(`Seeded synthetic records in MongoDB database: ${process.env.MONGODB_DATABASE || "prisha_clinic_test"}`);
  console.info("Test staff accounts: test.gynae@prisha.local, test.thyroid@prisha.local, test.admin@prisha.local");
  if (seedPassword) console.info(`Test account password (save privately): ${seedPassword}`);
  else console.info("Existing staff passwords were left unchanged. Set TEST_ACCOUNT_PASSWORD in .env to reset them.");
}

main().catch((error) => { console.error("Test seed failed:", error instanceof Error ? error.message : "Unknown error"); process.exitCode = 1; }).finally(() => void disconnectDatabase());
