from typing import Optional
from pydantic import BaseModel, field_validator

VALID_TIERS = {"A", "B", "C", "D", "E", "Unknown"}
SCORE_FIELDS = [
    "score_innovation", "score_influence", "score_technical_craft",
    "score_sonic_identity", "score_arrangement_skill", "score_rhythm_design",
    "score_melodic_harmonic", "score_sound_design", "score_mixing_aesthetics",
    "score_cultural_importance", "score_commercial_impact", "score_underground_impact",
    "score_longevity", "score_adaptability", "score_originality",
]


def _score_validator(v):
    if v is not None and not (1 <= v <= 10):
        raise ValueError(f"Score must be between 1 and 10, got {v}")
    return v


class RubricScoreSchema(BaseModel):
    score_innovation: Optional[int] = None
    score_influence: Optional[int] = None
    score_technical_craft: Optional[int] = None
    score_sonic_identity: Optional[int] = None
    score_arrangement_skill: Optional[int] = None
    score_rhythm_design: Optional[int] = None
    score_melodic_harmonic: Optional[int] = None
    score_sound_design: Optional[int] = None
    score_mixing_aesthetics: Optional[int] = None
    score_cultural_importance: Optional[int] = None
    score_commercial_impact: Optional[int] = None
    score_underground_impact: Optional[int] = None
    score_longevity: Optional[int] = None
    score_adaptability: Optional[int] = None
    score_originality: Optional[int] = None
    score_confidence: str = "Unknown"

    @field_validator(*SCORE_FIELDS, mode="before")
    @classmethod
    def validate_scores(cls, v):
        return _score_validator(v)

    @field_validator("score_confidence")
    @classmethod
    def validate_confidence(cls, v):
        if v not in VALID_TIERS:
            raise ValueError(f"confidence must be one of {VALID_TIERS}")
        return v


class SonicDNASchema(BaseModel):
    atmosphere: Optional[int] = None
    warmth: Optional[int] = None
    grit: Optional[int] = None
    polish: Optional[int] = None
    darkness: Optional[int] = None
    brightness: Optional[int] = None
    density: Optional[int] = None
    space: Optional[int] = None
    distortion: Optional[int] = None
    synthetic_organic_balance: Optional[int] = None
    notes: Optional[str] = None
    confidence: str = "D"

    @field_validator(
        "atmosphere", "warmth", "grit", "polish", "darkness", "brightness",
        "density", "space", "distortion", "synthetic_organic_balance", mode="before"
    )
    @classmethod
    def validate_scores(cls, v):
        return _score_validator(v)
