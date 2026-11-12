import Link from "next/link";
import { HeartPulse } from "lucide-react";

export function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`flex items-center gap-2.5 ${light ? "text-white" : "text-forest"}`} aria-label="Prisha's Clinic home">
    <span className={`grid h-11 w-11 place-items-center rounded-2xl ${light ? "bg-white/10" : "bg-mint"}`}><HeartPulse size={24} strokeWidth={1.8} /></span>
    <span className="leading-tight"><span className="serif block text-lg font-bold">Prisha’a</span><span className="block text-[10px] font-semibold tracking-wide">GYNAE & THYROID CLINIC</span></span>
  </Link>;
}
