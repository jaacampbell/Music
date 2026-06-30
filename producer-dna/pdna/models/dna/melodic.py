from typing import Optional, TYPE_CHECKING
from sqlalchemy import Text, BigInteger, SmallInteger, String, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base

if TYPE_CHECKING:
    from pdna.models.producers import Producer


class MelodicHarmonicDNA(Base):
    __tablename__ = "melodic_harmonic_dna"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id"), unique=True, nullable=False
    )
    chord_mood: Mapped[Optional[str]] = mapped_column(String(100))
    modality: Mapped[Optional[str]] = mapped_column(String(50))
    tonal_center: Mapped[Optional[str]] = mapped_column(String(50))
    dissonance_level: Mapped[Optional[int]] = mapped_column(SmallInteger)
    motif_complexity: Mapped[Optional[int]] = mapped_column(SmallInteger)
    influences_list: Mapped[Optional[list]] = mapped_column(ARRAY(String))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    confidence: Mapped[str] = mapped_column(String(10), default="D")

    producer: Mapped["Producer"] = relationship("Producer", back_populates="melodic_dna")

    def __repr__(self) -> str:
        return f"<MelodicHarmonicDNA producer_id={self.producer_id}>"
