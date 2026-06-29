from typing import Optional, TYPE_CHECKING
from sqlalchemy import Text, BigInteger, SmallInteger, String, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base

if TYPE_CHECKING:
    from pdna.models.producers import Producer


class SamplingDNA(Base):
    __tablename__ = "sampling_dna"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id"), unique=True, nullable=False
    )
    source_traditions: Mapped[Optional[list]] = mapped_column(ARRAY(String))
    chopping_style: Mapped[Optional[str]] = mapped_column(Text)
    pitch_shifting: Mapped[Optional[int]] = mapped_column(SmallInteger)
    filtering: Mapped[Optional[int]] = mapped_column(SmallInteger)
    looping_style: Mapped[Optional[str]] = mapped_column(Text)
    ethics_approach: Mapped[Optional[str]] = mapped_column(Text)
    clearance_rate: Mapped[Optional[str]] = mapped_column(String(30))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    confidence: Mapped[str] = mapped_column(String(10), default="D")

    producer: Mapped["Producer"] = relationship("Producer", back_populates="sampling_dna")

    def __repr__(self) -> str:
        return f"<SamplingDNA producer_id={self.producer_id}>"
