
import type { Metadata } from "next";
import "./globals.css";
import PWARegister from "./pwa-register";

export const metadata: Metadata = {
  title: "JOY TEAHOUSE | Order",
  description: "JOY TEAHOUSE mobile ordering",
  manifest: "/manifest.webmanifest",
  themeColor: "#16803c",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Joy Admin",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
