import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Prisha’a Clinic · Doctor Portal", description: "Doctor and clinic management portal preview." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
