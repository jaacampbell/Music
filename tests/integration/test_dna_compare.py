"""Integration tests for DNA similarity search and comparison commands."""
import pytest
from sqlalchemy import create_engine

from pdna.cli.cmd_dna import (
    DIM_SETS,
    euclidean_distance,
    load_dna_vectors,
)


class TestDNASimilar:
    def test_similar_returns_n_results(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            vectors = load_dna_vectors(conn)
        target = vectors["PDNA-000013"]
        dim_cols = DIM_SETS["all"]
        ranked = sorted(
            (euclidean_distance(target["dims"], other["dims"], dim_cols), pid)
            for pid, other in vectors.items()
            if pid != "PDNA-000013"
        )
        assert len(ranked) >= 5

    def test_self_distance_is_zero(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            vectors = load_dna_vectors(conn)
        for pid, v in vectors.items():
            d = euclidean_distance(v["dims"], v["dims"], DIM_SETS["all"])
            assert d == 0.0, f"{pid} self-distance should be 0, got {d}"

    def test_j_dilla_madlib_close(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            vectors = load_dna_vectors(conn)
        dim_cols = DIM_SETS["all"]

        def top5_ids(source_pid):
            target = vectors[source_pid]
            ranked = sorted(
                (euclidean_distance(target["dims"], other["dims"], dim_cols), pid)
                for pid, other in vectors.items()
                if pid != source_pid
            )
            return [pid for _, pid in ranked[:5]]

        assert "PDNA-000024" in top5_ids("PDNA-000013"), "Madlib not in J Dilla's top-5"
        assert "PDNA-000013" in top5_ids("PDNA-000024"), "J Dilla not in Madlib's top-5"

    def test_compare_symmetric_dimensions(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            vectors = load_dna_vectors(conn)
        a = vectors["PDNA-000013"]
        b = vectors["PDNA-000024"]
        dim_cols = DIM_SETS["all"]
        dist_ab = euclidean_distance(a["dims"], b["dims"], dim_cols)
        dist_ba = euclidean_distance(b["dims"], a["dims"], dim_cols)
        assert abs(dist_ab - dist_ba) < 1e-9, "Distance must be symmetric"

    def test_kraftwerk_moroder_close_in_synthetic(self, db_url):
        engine = create_engine(db_url)
        with engine.connect() as conn:
            vectors = load_dna_vectors(conn)
        dim_cols = DIM_SETS["sonic"]
        target = vectors["PDNA-000033"]
        ranked = sorted(
            (euclidean_distance(target["dims"], other["dims"], dim_cols), pid)
            for pid, other in vectors.items()
            if pid != "PDNA-000033"
        )
        top10_ids = [pid for _, pid in ranked[:10]]
        assert "PDNA-000007" in top10_ids, (
            f"Moroder not in Kraftwerk's top-10 sonic similar; got {top10_ids}"
        )
