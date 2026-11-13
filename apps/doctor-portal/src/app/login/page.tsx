"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, LockKeyhole, UserRoundPlus } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const path = mode === "login" ? "/auth/doctor/login" : "/auth/doctor/register";
      const body = mode === "login" ? { email, password } : { email, password, displayName, inviteCode };
      await api(path, { method: "POST", body: JSON.stringify(body) });
      window.location.href = "/";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="grid min-h-screen lg:grid-cols-2">
    <section className="hidden flex-col justify-between bg-[#123d31] p-12 text-white lg:flex">
      <Link href="/" className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><Activity/></span><span><strong className="display block text-lg">Prisha’s Clinic</strong><span className="text-[10px] tracking-widest text-white/65">DOCTOR PORTAL</span></span></Link>
      <div className="max-w-lg"><div className="text-xs font-bold uppercase tracking-widest text-emerald-200">Clinic workspace</div><h1 className="display mt-5 text-5xl leading-tight">A clear view of the day ahead.</h1><p className="mt-5 leading-7 text-white/65">Sign in with the email and password provided for your clinic account.</p></div>
      <div className="text-xs text-white/50">Doctor accounts require a clinic invite code.</div>
    </section>
    <section className="flex items-center justify-center px-5 py-12"><div className="surface w-full max-w-md rounded-[28px] p-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-mint text-forest">{mode === "login" ? <Activity/> : <UserRoundPlus/>}</div>
      <h2 className="display mt-5 text-center text-3xl">{mode === "login" ? "Doctor sign in" : "Create doctor account"}</h2>
      <p className="mt-2 text-center text-sm text-slate-500">{mode === "login" ? "Use your clinic email and password." : "Registration is limited to doctors with a clinic invite code."}</p>
      <form onSubmit={event => void submit(event)} className="mt-7 grid gap-4">
        {mode === "register" && <label className="text-sm font-semibold">Full name<input required className="field mt-2" value={displayName} onChange={event => setDisplayName(event.target.value)} autoComplete="name" maxLength={120}/></label>}
        <label className="text-sm font-semibold">Email<input required type="email" className="field mt-2" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@clinic.com" autoComplete="username" maxLength={254}/></label>
        <label className="text-sm font-semibold">Password<input required type="password" className="field mt-2" value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === "register" ? "At least 12 characters" : "Your clinic account password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 12 : 1} maxLength={72}/></label>
        {mode === "register" && <label className="text-sm font-semibold">Clinic invite code<input required type="password" className="field mt-2" value={inviteCode} onChange={event => setInviteCode(event.target.value)} autoComplete="off" maxLength={256}/><span className="mt-1 block text-xs font-normal text-slate-500">Ask the clinic administrator for this code.</span></label>}
        <button disabled={busy} className="rounded-full bg-forest py-3.5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="mt-5 w-full text-sm font-semibold text-forest">{mode === "login" ? "Have a clinic invite? Create an account" : "Already have an account? Sign in"}</button>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400"><LockKeyhole size={14}/>Secure sign-in with an HttpOnly session</p>
      <Link href="/admin/login" className="mt-5 block text-center text-sm font-semibold text-forest">Administrator sign in →</Link>
    </div></section>
  </main>;
}
