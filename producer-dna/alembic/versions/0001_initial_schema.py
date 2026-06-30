"""Initial schema: all tables, indexes, extensions, and FTS triggers

Revision ID: 0001
Revises:
Create Date: 2026-06-29
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR, ARRAY

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ── Taxonomy tables ──────────────────────────────────────────────────────

    op.create_table(
        "eras",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String(50), unique=True, nullable=False),
        sa.Column("label", sa.String(200), nullable=False),
        sa.Column("year_start", sa.SmallInteger),
        sa.Column("year_end", sa.SmallInteger),
        sa.Column("sort_order", sa.SmallInteger),
    )

    op.create_table(
        "genres",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String(100), unique=True, nullable=False),
        sa.Column("label", sa.String(200), nullable=False),
        sa.Column("parent_id", sa.Integer, sa.ForeignKey("genres.id")),
        sa.Column("fma_id", sa.Integer),
        sa.Column("mb_genre", sa.String(200)),
        sa.Column("region", sa.String(100)),
        sa.Column("era_id", sa.Integer, sa.ForeignKey("eras.id")),
    )
    op.create_index("genres_parent_idx", "genres", ["parent_id"])

    op.create_table(
        "producer_roles",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String(50), unique=True, nullable=False),
        sa.Column("label", sa.String(200), nullable=False),
        sa.Column("tier", sa.String(30)),
    )

    # ── Core Layer 1 tables ──────────────────────────────────────────────────

    op.create_table(
        "producers",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("pdna_id", sa.String(20), unique=True, nullable=False),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("real_name", sa.String(500)),
        sa.Column("country", sa.String(2)),
        sa.Column("city", sa.String(200)),
        sa.Column("region", sa.String(200)),
        sa.Column("active_from", sa.SmallInteger),
        sa.Column("active_to", sa.SmallInteger),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("official_links", JSONB, server_default="[]"),
        sa.Column("primary_scenes", JSONB, server_default="[]"),
        sa.Column("musicbrainz_id", sa.String(40)),
        sa.Column("wikidata_id", sa.String(20)),
        sa.Column("discogs_id", sa.BigInteger),
        sa.Column("notes", sa.Text),
        sa.Column("search_vector", TSVECTOR),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("producers_country_idx", "producers", ["country"])
    op.create_index("producers_active_from_idx", "producers", ["active_from"])
    op.create_index(
        "producers_search_gin", "producers", ["search_vector"],
        postgresql_using="gin"
    )

    op.create_table(
        "producer_aliases",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("producer_id", sa.BigInteger, sa.ForeignKey("producers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("alias", sa.String(500), nullable=False),
        sa.Column("alias_type", sa.String(50)),
        sa.Column("notes", sa.Text),
        sa.UniqueConstraint("producer_id", "alias", name="alias_producer_alias_unique"),
    )
    op.create_index("aliases_producer_idx", "producer_aliases", ["producer_id"])
    op.execute(
        "CREATE INDEX aliases_alias_trgm ON producer_aliases USING GIN (alias gin_trgm_ops)"
    )

    op.create_table(
        "works",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("title", sa.String(1000), nullable=False),
        sa.Column("work_type", sa.String(30), nullable=False),
        sa.Column("release_year", sa.SmallInteger),
        sa.Column("artist", sa.String(500)),
        sa.Column("label", sa.String(500)),
        sa.Column("country", sa.String(2)),
        sa.Column("musicbrainz_id", sa.String(40)),
        sa.Column("discogs_id", sa.Integer),
        sa.Column("isrc", sa.String(15)),
        sa.Column("upc", sa.String(20)),
        sa.Column("search_vector", TSVECTOR),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("works_release_year_idx", "works", ["release_year"])
    op.create_index("works_search_gin", "works", ["search_vector"], postgresql_using="gin")
    op.execute(
        "CREATE UNIQUE INDEX works_mb_id_uidx ON works (musicbrainz_id) "
        "WHERE musicbrainz_id IS NOT NULL"
    )

    op.create_table(
        "credits",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("producer_id", sa.BigInteger, sa.ForeignKey("producers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("work_id", sa.BigInteger, sa.ForeignKey("works.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("is_primary", sa.Boolean, default=False),
        sa.Column("confidence", sa.String(10), default="Unknown"),
        sa.Column("notes", sa.Text),
        sa.UniqueConstraint("producer_id", "work_id", "role", name="credits_unique"),
    )
    op.create_index("credits_producer_idx", "credits", ["producer_id"])
    op.create_index("credits_work_idx", "credits", ["work_id"])
    op.create_index("credits_role_idx", "credits", ["role"])

    op.create_table(
        "sources",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("producer_id", sa.BigInteger, sa.ForeignKey("producers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_url", sa.Text),
        sa.Column("source_type", sa.String(50)),
        sa.Column("date_accessed", sa.Date),
        sa.Column("reliability", sa.String(10), nullable=False, default="Unknown"),
        sa.Column("claim_supported", sa.Text, nullable=False),
        sa.Column("quote_summary", sa.Text),
        sa.Column("citation_status", sa.String(30), default="unverified"),
        sa.Column("archive_url", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("sources_producer_idx", "sources", ["producer_id"])
    op.create_index("sources_reliability_idx", "sources", ["reliability"])

    op.create_table(
        "gear_claims",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("producer_id", sa.BigInteger, sa.ForeignKey("producers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("gear_category", sa.String(30), nullable=False),
        sa.Column("gear_name", sa.String(500), nullable=False),
        sa.Column("gear_era", sa.String(50)),
        sa.Column("status", sa.String(20), nullable=False, default="reported"),
        sa.Column("source_id", sa.BigInteger, sa.ForeignKey("sources.id")),
        sa.Column("notes", sa.Text),
    )
    op.create_index("gear_producer_idx", "gear_claims", ["producer_id"])
    op.create_index("gear_category_idx", "gear_claims", ["gear_category"])

    op.create_table(
        "collaborator_edges",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("from_producer_id", sa.BigInteger, sa.ForeignKey("producers.id"), nullable=False),
        sa.Column("to_entity_type", sa.String(30), nullable=False),
        sa.Column("to_producer_id", sa.BigInteger, sa.ForeignKey("producers.id")),
        sa.Column("to_entity_name", sa.String(500)),
        sa.Column("edge_type", sa.String(50), nullable=False),
        sa.Column("strength", sa.SmallInteger),
        sa.Column("work_count", sa.Integer, default=0),
        sa.Column("notes", sa.Text),
    )
    op.create_index("collab_from_idx", "collaborator_edges", ["from_producer_id"])
    op.execute(
        "CREATE INDEX collab_to_prod_idx ON collaborator_edges (to_producer_id) "
        "WHERE to_producer_id IS NOT NULL"
    )

    op.create_table(
        "influence_edges",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("from_producer_id", sa.BigInteger, sa.ForeignKey("producers.id"), nullable=False),
        sa.Column("to_producer_id", sa.BigInteger, sa.ForeignKey("producers.id"), nullable=False),
        sa.Column("direction", sa.String(30), nullable=False),
        sa.Column("confidence", sa.String(10), default="Unknown"),
        sa.Column("strength", sa.SmallInteger),
        sa.Column("notes", sa.Text),
        sa.UniqueConstraint("from_producer_id", "to_producer_id", "direction", name="influence_unique"),
    )
    op.create_index("influence_from_idx", "influence_edges", ["from_producer_id"])
    op.create_index("influence_to_idx", "influence_edges", ["to_producer_id"])

    # ── Layer 2: DNA tables ──────────────────────────────────────────────────

    op.create_table(
        "producer_profiles",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("producer_id", sa.BigInteger, sa.ForeignKey("producers.id"), unique=True, nullable=False),
        sa.Column("dna_summary", sa.Text),
        sa.Column("analyst_notes", sa.Text),
        sa.Column("era_id", sa.Integer, sa.ForeignKey("eras.id")),
        sa.Column("primary_role_id", sa.Integer, sa.ForeignKey("producer_roles.id")),
        sa.Column("score_innovation", sa.SmallInteger),
        sa.Column("score_influence", sa.SmallInteger),
        sa.Column("score_technical_craft", sa.SmallInteger),
        sa.Column("score_sonic_identity", sa.SmallInteger),
        sa.Column("score_arrangement_skill", sa.SmallInteger),
        sa.Column("score_rhythm_design", sa.SmallInteger),
        sa.Column("score_melodic_harmonic", sa.SmallInteger),
        sa.Column("score_sound_design", sa.SmallInteger),
        sa.Column("score_mixing_aesthetics", sa.SmallInteger),
        sa.Column("score_cultural_importance", sa.SmallInteger),
        sa.Column("score_commercial_impact", sa.SmallInteger),
        sa.Column("score_underground_impact", sa.SmallInteger),
        sa.Column("score_longevity", sa.SmallInteger),
        sa.Column("score_adaptability", sa.SmallInteger),
        sa.Column("score_originality", sa.SmallInteger),
        sa.Column("score_confidence", sa.String(10), default="Unknown"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    def _dna_table(name, extra_cols):
        base_cols = [
            sa.Column("id", sa.BigInteger, primary_key=True),
            sa.Column("producer_id", sa.BigInteger, sa.ForeignKey("producers.id"), unique=True, nullable=False),
        ]
        base_cols.extend(extra_cols)
        base_cols.extend([
            sa.Column("notes", sa.Text),
            sa.Column("confidence", sa.String(10), default="D"),
        ])
        op.create_table(name, *base_cols)

    _dna_table("sonic_dna", [
        sa.Column("atmosphere", sa.SmallInteger),
        sa.Column("warmth", sa.SmallInteger),
        sa.Column("grit", sa.SmallInteger),
        sa.Column("polish", sa.SmallInteger),
        sa.Column("darkness", sa.SmallInteger),
        sa.Column("brightness", sa.SmallInteger),
        sa.Column("density", sa.SmallInteger),
        sa.Column("space", sa.SmallInteger),
        sa.Column("distortion", sa.SmallInteger),
        sa.Column("synthetic_organic_balance", sa.SmallInteger),
    ])

    _dna_table("rhythmic_dna", [
        sa.Column("swing", sa.SmallInteger),
        sa.Column("grid_precision", sa.SmallInteger),
        sa.Column("drum_density", sa.SmallInteger),
        sa.Column("groove_family", sa.String(100)),
        sa.Column("kick_language", sa.Text),
        sa.Column("snare_language", sa.Text),
        sa.Column("hat_language", sa.Text),
        sa.Column("percussion_behavior", sa.Text),
        sa.Column("tempo_min", sa.SmallInteger),
        sa.Column("tempo_max", sa.SmallInteger),
        sa.Column("tempo_signature", sa.String(10), server_default="4/4"),
    ])

    _dna_table("melodic_harmonic_dna", [
        sa.Column("chord_mood", sa.String(100)),
        sa.Column("modality", sa.String(50)),
        sa.Column("tonal_center", sa.String(50)),
        sa.Column("dissonance_level", sa.SmallInteger),
        sa.Column("motif_complexity", sa.SmallInteger),
        sa.Column("influences_list", ARRAY(sa.String)),
    ])

    _dna_table("arrangement_dna", [
        sa.Column("intro_style", sa.Text),
        sa.Column("drop_behavior", sa.Text),
        sa.Column("chorus_behavior", sa.Text),
        sa.Column("loop_evolution", sa.SmallInteger),
        sa.Column("transition_style", sa.Text),
        sa.Column("tension_release", sa.SmallInteger),
        sa.Column("structural_complexity", sa.SmallInteger),
    ])

    _dna_table("mixing_dna", [
        sa.Column("low_end_approach", sa.Text),
        sa.Column("midrange_approach", sa.Text),
        sa.Column("high_end_approach", sa.Text),
        sa.Column("loudness_level", sa.SmallInteger),
        sa.Column("stereo_width", sa.SmallInteger),
        sa.Column("vocal_placement", sa.Text),
        sa.Column("reverb_use", sa.SmallInteger),
        sa.Column("delay_use", sa.SmallInteger),
        sa.Column("compression", sa.SmallInteger),
        sa.Column("saturation", sa.SmallInteger),
    ])

    _dna_table("sampling_dna", [
        sa.Column("source_traditions", ARRAY(sa.String)),
        sa.Column("chopping_style", sa.Text),
        sa.Column("pitch_shifting", sa.SmallInteger),
        sa.Column("filtering", sa.SmallInteger),
        sa.Column("looping_style", sa.Text),
        sa.Column("ethics_approach", sa.Text),
        sa.Column("clearance_rate", sa.String(30)),
    ])

    op.create_table(
        "style_nuance_map",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("producer_id", sa.BigInteger, sa.ForeignKey("producers.id"), unique=True, nullable=False),
        sa.Column("casual_listener", sa.Text),
        sa.Column("producer_ear", sa.Text),
        sa.Column("engineer_ear", sa.Text),
        sa.Column("artist_ear", sa.Text),
        sa.Column("dj_ear", sa.Text),
        sa.Column("beginner_ear", sa.Text),
        sa.Column("confidence", sa.String(10), default="D"),
    )

    # ── Layer 3: Creative tables ─────────────────────────────────────────────

    op.create_table(
        "inspired_directions",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("producer_id", sa.BigInteger, sa.ForeignKey("producers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("direction_text", sa.Text, nullable=False),
        sa.Column("direction_type", sa.String(50)),
        sa.Column("sort_order", sa.SmallInteger),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("inspired_dir_producer_idx", "inspired_directions", ["producer_id"])

    op.create_table(
        "creative_iterations",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("producer_id", sa.BigInteger, sa.ForeignKey("producers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("iteration_number", sa.SmallInteger, nullable=False),
        sa.Column("title", sa.String(500)),
        sa.Column("prompt_text", sa.Text, nullable=False),
        sa.Column("target_context", sa.String(100)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("producer_id", "iteration_number", name="creative_iter_unique"),
    )

    op.create_table(
        "originality_warnings",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("producer_id", sa.BigInteger, sa.ForeignKey("producers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("warning_type", sa.String(50), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("severity", sa.String(20), default="moderate"),
    )

    op.create_table(
        "fusion_paths",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("primary_producer_id", sa.BigInteger, sa.ForeignKey("producers.id"), nullable=False),
        sa.Column("secondary_element", sa.String(500), nullable=False),
        sa.Column("secondary_producer_id", sa.BigInteger, sa.ForeignKey("producers.id")),
        sa.Column("fusion_description", sa.Text, nullable=False),
        sa.Column("creative_prompt", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "prompt_exports",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("producer_id", sa.BigInteger, sa.ForeignKey("producers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("prompt_type", sa.String(50), nullable=False),
        sa.Column("prompt_text", sa.Text, nullable=False),
        sa.Column("model_target", sa.String(100)),
        sa.Column("version", sa.Integer, default=1),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── FTS triggers ─────────────────────────────────────────────────────────

    op.execute("""
        CREATE OR REPLACE FUNCTION producers_fts_update() RETURNS trigger AS $$
        BEGIN
          NEW.search_vector :=
            setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.real_name, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'C');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("""
        CREATE TRIGGER producers_fts_trigger
          BEFORE INSERT OR UPDATE ON producers
          FOR EACH ROW EXECUTE FUNCTION producers_fts_update();
    """)

    op.execute("""
        CREATE OR REPLACE FUNCTION works_fts_update() RETURNS trigger AS $$
        BEGIN
          NEW.search_vector :=
            setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.artist, '')), 'B');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("""
        CREATE TRIGGER works_fts_trigger
          BEFORE INSERT OR UPDATE ON works
          FOR EACH ROW EXECUTE FUNCTION works_fts_update();
    """)


def downgrade() -> None:
    tables = [
        "prompt_exports", "fusion_paths", "originality_warnings",
        "creative_iterations", "inspired_directions", "style_nuance_map",
        "sampling_dna", "mixing_dna", "arrangement_dna", "melodic_harmonic_dna",
        "rhythmic_dna", "sonic_dna", "producer_profiles",
        "influence_edges", "collaborator_edges", "gear_claims", "sources",
        "credits", "works", "producer_aliases", "producers",
        "producer_roles", "genres", "eras",
    ]
    for t in tables:
        op.execute(f"DROP TABLE IF EXISTS {t} CASCADE")
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
