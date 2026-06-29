from typing import Optional, TYPE_CHECKING
from sqlalchemy import Text, BigInteger, SmallInteger, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base

if TYPE_CHECKING:
    from pdna.models.producers import Producer


class MixingDNA(Base):
    __tablename__ = "mixing_dna"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id"), unique=True, nullable=False
    )
    low_end_approach: Mapped[Optional[str]] = mapped_column(Text)
    midrange_approach: Mapped[Optional[str]] = mapped_column(Text)
    high_end_approach: Mapped[Optional[str]] = mapped_column(Text)
    loudness_level: Mapped[Optional[int]] = mapped_column(SmallInteger)
    stereo_width: Mapped[Optional[int]] = mapped_column(SmallInteger)
    vocal_placement: Mapped[Optional[str]] = mapped_column(Text)
    reverb_use: Mapped[Optional[int]] = mapped_column(SmallInteger)
    delay_use: Mapped[Optional[int]] = mapped_column(SmallInteger)
    compression: Mapped[Optional[int]] = mapped_column(SmallInteger)
    saturation: Mapped[Optional[int]] = mapped_column(SmallInteger)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    confidence: Mapped[str] = mapped_column(String(10), default="D")

    producer: Mapped["Producer"] = relationship("Producer", back_populates="mixing_dna")

    def __repr__(self) -> str:
        return f"<MixingDNA producer_id={self.producer_id}>"
