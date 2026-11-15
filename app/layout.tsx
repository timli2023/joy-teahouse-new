import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JOY TEAHOUSE | Order",
  description: "JOY TEAHOUSE mobile ordering",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh"><body>{children}</body></html>;
}
