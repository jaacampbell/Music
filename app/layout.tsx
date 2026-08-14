import type { Metadata } from "next";

import { CloudProjectBridge } from "@/app/components/CloudProjectBridge";
import "./globals.css";

export const metadata: Metadata = {
  title: "Music OS — Guided Production Workspace",
  description: "A guided music production workspace for creating, analyzing, improving, separating, protecting, and releasing songs."
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
