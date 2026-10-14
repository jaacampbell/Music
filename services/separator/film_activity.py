"""Conservative activity counter for the JC Film Studio GPU worker.

Unknown and nonterminal states are treated as active to avoid interrupting renders.
"""
from __future__ import annotations
from typing import Any, Mapping

TERMINAL = frozenset({"completed", "failed", "cancelled", "canceled"})

def film_gpu_occupancy(generation_jobs: Mapping[str, dict[str, Any]],
                       editor_jobs: Mapping[str, dict[str, Any]]) -> dict[str, Any]:
    active = sum(
        str(info.get("status", "")).lower() not in TERMINAL
        for collection in (generation_jobs, editor_jobs)
        for info in collection.values()
    )
    return {"busy": active > 0, "activeJobs": active}
