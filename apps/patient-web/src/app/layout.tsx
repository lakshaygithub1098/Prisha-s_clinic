import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prisha'a Gynae & Thyroid Clinic",
  description: "Thoughtful care for women's health and thyroid wellness.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
