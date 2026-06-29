from typing import Optional, TYPE_CHECKING
from sqlalchemy import Text, BigInteger, SmallInteger, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base

if TYPE_CHECKING:
    from pdna.models.producers import Producer


class RhythmicDNA(Base):
    __tablename__ = "rhythmic_dna"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id"), unique=True, nullable=False
    )
    swing: Mapped[Optional[int]] = mapped_column(SmallInteger)
    grid_precision: Mapped[Optional[int]] = mapped_column(SmallInteger)
    drum_density: Mapped[Optional[int]] = mapped_column(SmallInteger)
    groove_family: Mapped[Optional[str]] = mapped_column(String(100))
    kick_language: Mapped[Optional[str]] = mapped_column(Text)
    snare_language: Mapped[Optional[str]] = mapped_column(Text)
    hat_language: Mapped[Optional[str]] = mapped_column(Text)
    percussion_behavior: Mapped[Optional[str]] = mapped_column(Text)
    tempo_min: Mapped[Optional[int]] = mapped_column(SmallInteger)
    tempo_max: Mapped[Optional[int]] = mapped_column(SmallInteger)
    tempo_signature: Mapped[str] = mapped_column(String(10), default="4/4")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    confidence: Mapped[str] = mapped_column(String(10), default="D")

    producer: Mapped["Producer"] = relationship("Producer", back_populates="rhythmic_dna")

    def __repr__(self) -> str:
        return f"<RhythmicDNA producer_id={self.producer_id}>"
