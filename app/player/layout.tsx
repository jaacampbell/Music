import type { Metadata } from "next";

import "../../apps/player/src/index.css";

export const metadata: Metadata = {
  title: "JO₵YN Music Workspace",
  description: "A local-first listening room for masters, demos, references, and private music review."
};

export default function PlayerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
