from __future__ import annotations

from pathlib import Path

EXPECTED_SUPABASE = "https://jgnsrjjgeodqruafafav.supabase.co"
RUNPOD_WORKFLOW = Path(".github/workflows/stem-runpod-control.yml")
PRODUCTION_SMOKE = Path(".github/workflows/production-smoke.yml")
EXPECTED_SITE = "https://musicdevnc.netlify.app"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"Production configuration invariant failed: {message}")


def main() -> None:
    runpod = RUNPOD_WORKFLOW.read_text(encoding="utf-8")
    smoke = PRODUCTION_SMOKE.read_text(encoding="utf-8")

    require(
        f"SUPABASE_URL: {EXPECTED_SUPABASE}" in runpod,
        "Stem GPU Control is not pinned to the production music-os Supabase project.",
    )
    require(
        "uxypcdelqiiopexxnjsn.supabase.co" not in runpod,
        "Stem GPU Control contains the known non-production Supabase project ref.",
    )
    require(
        f"SITE: {EXPECTED_SITE}" in smoke,
        "Production Smoke is not pointed at the production Netlify site.",
    )

    print("Production cloud invariants OK")
    print(f"Supabase: {EXPECTED_SUPABASE}")
    print(f"Netlify: {EXPECTED_SITE}")


if __name__ == "__main__":
    main()
