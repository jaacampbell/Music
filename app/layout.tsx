import type { Metadata } from "next";

import { CloudProjectBridge } from "@/app/components/CloudProjectBridge";
import "./globals.css";

export const metadata: Metadata = {
  title: "TM Music Studio — Music OS and Studio Brain",
  description: "TM Music Studio combines Studio Brain, Producer DNA, song development, AI Style Control, Stem Director, MIDI Shredder, project management, DAW handoff, and release preparation."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <CloudProjectBridge />
      </body>
    </html>
  );
}
