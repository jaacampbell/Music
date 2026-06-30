from typing import Optional, TYPE_CHECKING
from sqlalchemy import Text, BigInteger, SmallInteger, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base

if TYPE_CHECKING:
    from pdna.models.producers import Producer


class ArrangementDNA(Base):
    __tablename__ = "arrangement_dna"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id"), unique=True, nullable=False
    )
    intro_style: Mapped[Optional[str]] = mapped_column(Text)
    drop_behavior: Mapped[Optional[str]] = mapped_column(Text)
    chorus_behavior: Mapped[Optional[str]] = mapped_column(Text)
    loop_evolution: Mapped[Optional[int]] = mapped_column(SmallInteger)
    transition_style: Mapped[Optional[str]] = mapped_column(Text)
    tension_release: Mapped[Optional[int]] = mapped_column(SmallInteger)
    structural_complexity: Mapped[Optional[int]] = mapped_column(SmallInteger)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    confidence: Mapped[str] = mapped_column(String(10), default="D")

    producer: Mapped["Producer"] = relationship("Producer", back_populates="arrangement_dna")

    def __repr__(self) -> str:
        return f"<ArrangementDNA producer_id={self.producer_id}>"
