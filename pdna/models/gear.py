from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, BigInteger, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base

if TYPE_CHECKING:
    from pdna.models.producers import Producer
    from pdna.models.sources import Source


class GearClaim(Base):
    __tablename__ = "gear_claims"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id", ondelete="CASCADE"), nullable=False
    )
    gear_category: Mapped[str] = mapped_column(String(30), nullable=False)
    gear_name: Mapped[str] = mapped_column(String(500), nullable=False)
    gear_era: Mapped[Optional[str]] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="reported")
    source_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("sources.id"))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    producer: Mapped["Producer"] = relationship("Producer", back_populates="gear_claims")
    source: Mapped[Optional["Source"]] = relationship("Source")

    __table_args__ = (
        Index("gear_producer_idx", "producer_id"),
        Index("gear_category_idx", "gear_category"),
    )

    def __repr__(self) -> str:
        return f"<GearClaim [{self.status}] {self.gear_name}>"
