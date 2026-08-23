"use client";

import PlayerApp from "../../apps/player/src/App";

export default function PlayerPage() {
  return <PlayerApp cloudConfig={{
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }} />;
}
