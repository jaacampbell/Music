import type { Metadata } from "next";

import { CloudProjectBridge } from "@/app/components/CloudProjectBridge";
import "./globals.css";

export const metadata: Metadata = {
  title: "TM Music Studio — AI Production Workspace",
  description: "TM Music Studio combines song development, Producer DNA, AI Style Control, Stem Director, project management, DAW handoff, and release preparation in one hosted production workspace."
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
