from dataclasses import dataclass, field
from typing import Optional

DIMENSIONS = [
    "innovation", "influence", "technical_craft", "sonic_identity",
    "arrangement_skill", "rhythm_design", "melodic_harmonic", "sound_design",
    "mixing_aesthetics", "cultural_importance", "commercial_impact",
    "underground_impact", "longevity", "adaptability", "originality",
]


@dataclass
class DNAScoreCard:
    innovation: Optional[int] = None
    influence: Optional[int] = None
    technical_craft: Optional[int] = None
    sonic_identity: Optional[int] = None
    arrangement_skill: Optional[int] = None
    rhythm_design: Optional[int] = None
    melodic_harmonic: Optional[int] = None
    sound_design: Optional[int] = None
    mixing_aesthetics: Optional[int] = None
    cultural_importance: Optional[int] = None
    commercial_impact: Optional[int] = None
    underground_impact: Optional[int] = None
    longevity: Optional[int] = None
    adaptability: Optional[int] = None
    originality: Optional[int] = None

    def validate(self) -> list[str]:
        errors = []
        for dim in DIMENSIONS:
            val = getattr(self, dim)
            if val is not None and not (1 <= val <= 10):
                errors.append(f"{dim}: must be 1–10, got {val}")
        return errors

    def is_complete(self) -> bool:
        return all(getattr(self, d) is not None for d in DIMENSIONS)

    def to_db_dict(self) -> dict:
        return {f"score_{d}": getattr(self, d) for d in DIMENSIONS}

    def summary(self) -> str:
        if not self.is_complete():
            filled = sum(1 for d in DIMENSIONS if getattr(self, d) is not None)
            return f"Incomplete ({filled}/{len(DIMENSIONS)} filled)"
        vals = [getattr(self, d) for d in DIMENSIONS]
        avg = sum(vals) / len(vals)
        return f"Complete — avg {avg:.1f}/10"
