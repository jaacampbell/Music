import type { Metadata } from "next";

import "../../apps/player/src/index.css";

export const metadata: Metadata = {
  title: "JO₵YN Music Workspace",
  description: "A private listening room with browser-local playback and secure Music OS cloud uploads.",
  other: {
    "music-os-supabase-url": process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    "music-os-supabase-key": process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  }
};

export default function PlayerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
