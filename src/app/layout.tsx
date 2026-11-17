import type { Metadata } from "next";
import { Geist_Mono, Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-display",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

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
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased text-ink">{children}</body>
    </html>
  );
}
