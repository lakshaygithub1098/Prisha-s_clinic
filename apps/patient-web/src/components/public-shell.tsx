"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/brand";

const links = [["Home", "/"], ["About Us", "/about"], ["Services", "/services"], ["Contact", "/contact"]];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-40 border-b border-emerald-950/5 bg-[#fafbf8]/90 backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
      <Brand />
      <nav className="hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Main navigation">
        {links.map(([label, href]) => <Link className="nav-link" key={href} href={href}>{label}</Link>)}
      </nav>
      <div className="hidden items-center gap-3 md:flex">
        <Link href="/patient/login" className="rounded-full px-4 py-2 text-sm font-semibold text-forest hover:bg-mint">Patient login</Link>
        <Link href="/book" className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-forest/15 transition hover:bg-emerald-900">Book appointment <ArrowUpRight size={16} /></Link>
      </div>
      <button className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-900/10 md:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
    </div>
    {open && <nav className="border-t border-emerald-950/5 bg-white px-5 py-4 md:hidden">{links.map(([label, href]) => <Link onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-medium" key={href} href={href}>{label}</Link>)}<Link className="mt-2 block rounded-full bg-forest px-4 py-3 text-center text-sm font-semibold text-white" href="/book">Book appointment</Link><Link className="mt-2 block px-4 py-3 text-center text-sm font-semibold text-forest" href="/patient/login">Patient login</Link></nav>}
  </header>;
}

export function PublicFooter() {
  return <footer className="bg-[#123d31] text-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
      <div><Brand light /><p className="mt-5 max-w-sm text-sm leading-6 text-white/70">Thoughtful care for women’s health and thyroid wellbeing. Clinic details will be added after verification.</p></div>
      <div><h3 className="font-semibold">Explore</h3><div className="mt-4 grid gap-3 text-sm text-white/70"><Link href="/about">About the clinic</Link><Link href="/services">Our services</Link><Link href="/book">Book appointment</Link><Link href="/patient/login">Patient portal</Link></div></div>
      <div><h3 className="font-semibold">Visit or contact</h3><p className="mt-4 text-sm leading-6 text-white/70">Clinic address, phone, email and hours<br />Pending clinic confirmation</p><Link href="/contact" className="mt-4 inline-block text-sm font-semibold text-emerald-200">Contact information →</Link></div>
    </div>
    <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-white/50">© {new Date().getFullYear()} Prisha’a Gynae & Thyroid Clinic · Information placeholders are not clinic-verified.</div>
  </footer>;
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return <div className="shell"><PublicHeader />{children}<PublicFooter /></div>;
}
