import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "TaskFlow — managed task marketplace",
    template: "%s · TaskFlow",
  },
  description:
    "Collect task requests, route them to the right taskers, track delivery against budget, run quality control, and pay everyone — on open infrastructure you can self-host.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased text-gray-900">{children}</body>
    </html>
  );
}
