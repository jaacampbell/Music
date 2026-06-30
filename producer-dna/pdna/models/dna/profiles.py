from typing import Optional, TYPE_CHECKING
from sqlalchemy import Text, BigInteger, Integer, SmallInteger, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from pdna.models.producers import Producer


def _score_col(name: str):
    return mapped_column(SmallInteger, name=name, nullable=True)


class ProducerProfile(Base, TimestampMixin):
    __tablename__ = "producer_profiles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id"), unique=True, nullable=False
    )
    dna_summary: Mapped[Optional[str]] = mapped_column(Text)
    analyst_notes: Mapped[Optional[str]] = mapped_column(Text)
    era_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("eras.id"))
    primary_role_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("producer_roles.id"))

    # 15-dimension DNA scoring rubric (1-10)
    score_innovation: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_influence: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_technical_craft: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_sonic_identity: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_arrangement_skill: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_rhythm_design: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_melodic_harmonic: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_sound_design: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_mixing_aesthetics: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_cultural_importance: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_commercial_impact: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_underground_impact: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_longevity: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_adaptability: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_originality: Mapped[Optional[int]] = mapped_column(SmallInteger)
    score_confidence: Mapped[str] = mapped_column(String(10), default="Unknown")

    producer: Mapped["Producer"] = relationship("Producer", back_populates="profile")

    SCORE_FIELDS = [
        "score_innovation", "score_influence", "score_technical_craft",
        "score_sonic_identity", "score_arrangement_skill", "score_rhythm_design",
        "score_melodic_harmonic", "score_sound_design", "score_mixing_aesthetics",
        "score_cultural_importance", "score_commercial_impact", "score_underground_impact",
        "score_longevity", "score_adaptability", "score_originality",
    ]

    def scores_complete(self) -> bool:
        return all(getattr(self, f) is not None for f in self.SCORE_FIELDS)

    def __repr__(self) -> str:
        return f"<ProducerProfile producer_id={self.producer_id}>"
