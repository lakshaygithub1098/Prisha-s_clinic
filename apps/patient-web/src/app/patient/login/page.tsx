"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, HeartPulse, LockKeyhole, Mail } from "lucide-react";
import { Brand } from "@/components/brand";
import { api } from "@/lib/api";

export default function PatientLoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (mode === "register" && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await api(mode === "register" ? "/auth/patient/register" : "/auth/patient/login", {
        method: "POST",
        body: JSON.stringify({ email, password, ...(mode === "register" ? { givenName, familyName } : {}) }),
      });
      window.location.href = "/patient/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="grid min-h-screen bg-[#f6f8f5] lg:grid-cols-2">
    <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#e7f1e9] via-[#dcebe0] to-[#c6ddce] p-12 lg:flex lg:flex-col lg:justify-between">
      <Brand/><div className="leaf left-16 top-36 h-44 w-20"/>
      <div className="relative z-10 max-w-xl"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-forest"><HeartPulse size={27}/></span>
        <h1 className="serif mt-7 text-5xl font-semibold leading-tight text-[#173d31]">Your care, in one calm place.</h1>
        <p className="mt-5 max-w-md text-lg leading-8 text-slate-600">Sign in to see appointments and information shared with you by the clinic.</p>
      </div><p className="text-xs text-slate-500">Use an email address you can access and keep your password private.</p>
    </section>
    <section className="flex items-center justify-center px-5 py-12"><div className="w-full max-w-md">
      <Link className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 lg:hidden" href="/"><ArrowLeft size={16}/>Back to clinic</Link>
      <div className="lg:hidden"><Brand/></div>
      <div className="surface mt-8 rounded-[30px] p-7 sm:p-9">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-mint text-forest"><Mail size={25}/></div>
        <h2 className="serif mt-5 text-center text-3xl font-semibold">{mode === "login" ? "Patient sign in" : "Create your account"}</h2>
        <p className="mt-3 text-center text-sm leading-6 text-slate-500">{mode === "login" ? "Sign in with your email and password." : "Create an account to book and manage appointments."}</p>
        <form onSubmit={(event) => void submit(event)} className="mt-7">
          {mode === "register" && <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-semibold">First name<input required className="field mt-2" value={givenName} onChange={e => setGivenName(e.target.value)} autoComplete="given-name" maxLength={80}/></label>
            <label className="text-sm font-semibold">Last name<input className="field mt-2" value={familyName} onChange={e => setFamilyName(e.target.value)} autoComplete="family-name" maxLength={80}/></label>
          </div>}
          <label className="mt-4 block text-sm font-semibold">Email address<input required type="email" className="field mt-2" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" maxLength={254}/></label>
          <label className="mt-4 block text-sm font-semibold">Password<input required type="password" className="field mt-2" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 12 : 1} maxLength={72}/>{mode === "register" && <span className="mt-1 block text-xs font-normal text-slate-500">Use at least 12 characters.</span>}</label>
          {mode === "register" && <label className="mt-4 block text-sm font-semibold">Confirm password<input required type="password" className="field mt-2" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={12} maxLength={72}/></label>}
          <button disabled={busy} className="mt-5 w-full rounded-full bg-forest py-3.5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="mt-5 w-full text-sm font-semibold text-forest">{mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400"><LockKeyhole size={13}/>Passwords are stored as secure hashes</div>
      </div><Link href="/" className="mt-6 block text-center text-sm font-medium text-slate-500">← Return to clinic website</Link>
    </div></section>
  </main>;
}
