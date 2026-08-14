import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Music OS — Guided Production Workspace",
  description: "A guided music production workspace for creating, analyzing, improving, separating, and exporting songs."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
