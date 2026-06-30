from typing import Optional, TYPE_CHECKING
from sqlalchemy import Text, BigInteger, SmallInteger, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base

if TYPE_CHECKING:
    from pdna.models.producers import Producer


class SonicDNA(Base):
    __tablename__ = "sonic_dna"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id"), unique=True, nullable=False
    )
    atmosphere: Mapped[Optional[int]] = mapped_column(SmallInteger)
    warmth: Mapped[Optional[int]] = mapped_column(SmallInteger)
    grit: Mapped[Optional[int]] = mapped_column(SmallInteger)
    polish: Mapped[Optional[int]] = mapped_column(SmallInteger)
    darkness: Mapped[Optional[int]] = mapped_column(SmallInteger)
    brightness: Mapped[Optional[int]] = mapped_column(SmallInteger)
    density: Mapped[Optional[int]] = mapped_column(SmallInteger)
    space: Mapped[Optional[int]] = mapped_column(SmallInteger)
    distortion: Mapped[Optional[int]] = mapped_column(SmallInteger)
    synthetic_organic_balance: Mapped[Optional[int]] = mapped_column(SmallInteger)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    confidence: Mapped[str] = mapped_column(String(10), default="D")

    producer: Mapped["Producer"] = relationship("Producer", back_populates="sonic_dna")

    def __repr__(self) -> str:
        return f"<SonicDNA producer_id={self.producer_id}>"
