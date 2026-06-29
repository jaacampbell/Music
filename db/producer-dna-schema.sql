-- Producer DNA Research Base — Postgres schema (Layer 1–3)
-- Designed for Netlify Database / Postgres migration.

-- Research confidence: A | B | C | D | E | Unknown

CREATE TABLE IF NOT EXISTS producer_batches (
  batch_number TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  genre_scene_focus TEXT NOT NULL,
  region_focus TEXT NOT NULL,
  era_focus TEXT NOT NULL,
  producer_count INTEGER NOT NULL DEFAULT 0,
  selection_criteria JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS producers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  real_name TEXT,
  gender TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  active_years TEXT,
  primary_scenes JSONB NOT NULL DEFAULT '[]',
  official_links JSONB NOT NULL DEFAULT '[]',
  batch_id TEXT REFERENCES producer_batches(batch_number),
  core_dna_angle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS producer_aliases (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  alias_type TEXT NOT NULL,
  time_period TEXT,
  confidence TEXT NOT NULL DEFAULT 'Unknown'
);

CREATE TABLE IF NOT EXISTS works (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  work_type TEXT NOT NULL,
  release_year INTEGER,
  artist TEXT,
  label TEXT,
  country TEXT,
  identifiers JSONB NOT NULL DEFAULT '{}',
  confidence TEXT NOT NULL DEFAULT 'Unknown'
);

CREATE TABLE IF NOT EXISTS credits (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'Unknown',
  source_id TEXT
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  date_accessed TIMESTAMPTZ NOT NULL,
  reliability_tier TEXT NOT NULL,
  claim_supported TEXT NOT NULL,
  quote_or_summary TEXT,
  citation_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS gear_claims (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  confidence TEXT NOT NULL DEFAULT 'Unknown',
  source_id TEXT REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS collaborator_edges (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL,
  target_name TEXT NOT NULL,
  edge_type TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'Unknown'
);

CREATE TABLE IF NOT EXISTS influence_edges (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL,
  target_name TEXT NOT NULL,
  edge_type TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'Unknown'
);

-- Layer 2: Analytical DNA
CREATE TABLE IF NOT EXISTS producer_profiles (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL UNIQUE REFERENCES producers(id) ON DELETE CASCADE,
  profile_text TEXT NOT NULL,
  signature_sound_summary TEXT NOT NULL,
  artistic_dna TEXT NOT NULL,
  technical_dna TEXT NOT NULL,
  research_confidence TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'D',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sonic_dna (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL UNIQUE REFERENCES producers(id) ON DELETE CASCADE,
  atmosphere TEXT,
  warmth TEXT,
  grit TEXT,
  polish TEXT,
  darkness TEXT,
  brightness TEXT,
  density TEXT,
  space TEXT,
  distortion TEXT,
  synthetic_organic_balance TEXT,
  confidence TEXT NOT NULL DEFAULT 'D'
);

CREATE TABLE IF NOT EXISTS rhythmic_dna (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL UNIQUE REFERENCES producers(id) ON DELETE CASCADE,
  swing TEXT,
  grid_precision TEXT,
  drum_density TEXT,
  groove_family TEXT,
  kick_snare_placement TEXT,
  hi_hat_language TEXT,
  percussion_behavior TEXT,
  tempo_ranges TEXT,
  confidence TEXT NOT NULL DEFAULT 'D'
);

CREATE TABLE IF NOT EXISTS melodic_harmonic_dna (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL UNIQUE REFERENCES producers(id) ON DELETE CASCADE,
  chord_mood TEXT,
  modality TEXT,
  tonal_center TEXT,
  influences JSONB DEFAULT '[]',
  motifs TEXT,
  dissonance TEXT,
  unresolved_tension TEXT,
  confidence TEXT NOT NULL DEFAULT 'D'
);

CREATE TABLE IF NOT EXISTS arrangement_dna (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL UNIQUE REFERENCES producers(id) ON DELETE CASCADE,
  intro_style TEXT,
  drop_chorus_behavior TEXT,
  loop_evolution TEXT,
  transitions TEXT,
  breakdowns TEXT,
  tension_release TEXT,
  moment_design TEXT,
  confidence TEXT NOT NULL DEFAULT 'D'
);

CREATE TABLE IF NOT EXISTS mixing_dna (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL UNIQUE REFERENCES producers(id) ON DELETE CASCADE,
  low_end TEXT,
  midrange TEXT,
  high_end_texture TEXT,
  loudness TEXT,
  stereo_field TEXT,
  vocal_placement TEXT,
  reverb_delay TEXT,
  compression TEXT,
  saturation TEXT,
  clipping TEXT,
  confidence TEXT NOT NULL DEFAULT 'D'
);

CREATE TABLE IF NOT EXISTS sampling_dna (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL UNIQUE REFERENCES producers(id) ON DELETE CASCADE,
  source_traditions JSONB DEFAULT '[]',
  chopping_style TEXT,
  pitch_shifting TEXT,
  filtering TEXT,
  looping TEXT,
  sample_ethics TEXT,
  clearance_status TEXT,
  confidence TEXT NOT NULL DEFAULT 'D'
);

CREATE TABLE IF NOT EXISTS style_nuance_map (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL UNIQUE REFERENCES producers(id) ON DELETE CASCADE,
  casual_listeners TEXT,
  producers TEXT,
  engineers TEXT,
  artists TEXT,
  djs TEXT,
  beginners_misunderstand TEXT,
  confidence TEXT NOT NULL DEFAULT 'D'
);

-- Layer 3: Creative Direction
CREATE TABLE IF NOT EXISTS inspired_directions (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  ethical_translation TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'D'
);

CREATE TABLE IF NOT EXISTS creative_iterations (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
  iteration_number INTEGER NOT NULL,
  direction TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'E'
);

CREATE TABLE IF NOT EXISTS originality_warnings (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  warning TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'D'
);

CREATE TABLE IF NOT EXISTS fusion_paths (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
  fusion_target TEXT NOT NULL,
  fusion_type TEXT NOT NULL,
  path TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'E'
);

CREATE TABLE IF NOT EXISTS prompt_exports (
  id TEXT PRIMARY KEY,
  producer_id TEXT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'D'
);

CREATE TABLE IF NOT EXISTS producer_dna_scores (
  producer_id TEXT PRIMARY KEY REFERENCES producers(id) ON DELETE CASCADE,
  scores JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  confidence TEXT NOT NULL DEFAULT 'E'
);

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_producers_batch ON producers(batch_id);
CREATE INDEX IF NOT EXISTS idx_producers_name ON producers(name);
CREATE INDEX IF NOT EXISTS idx_producers_region ON producers(region);
CREATE INDEX IF NOT EXISTS idx_credits_producer ON credits(producer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_producer ON producer_profiles(producer_id);
