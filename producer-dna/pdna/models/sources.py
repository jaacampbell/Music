from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Date, BigInteger, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from pdna.models.producers import Producer


class Source(Base, TimestampMixin):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id", ondelete="CASCADE"), nullable=False
    )
    source_url: Mapped[Optional[str]] = mapped_column(Text)
    source_type: Mapped[Optional[str]] = mapped_column(String(50))
    date_accessed: Mapped[Optional[str]] = mapped_column(Date)
    reliability: Mapped[str] = mapped_column(String(10), nullable=False, default="Unknown")
    claim_supported: Mapped[str] = mapped_column(Text, nullable=False)
    quote_summary: Mapped[Optional[str]] = mapped_column(Text)
    citation_status: Mapped[str] = mapped_column(String(30), default="unverified")
    archive_url: Mapped[Optional[str]] = mapped_column(Text)

    producer: Mapped["Producer"] = relationship("Producer", back_populates="sources")

    __table_args__ = (
        Index("sources_producer_idx", "producer_id"),
        Index("sources_reliability_idx", "reliability"),
    )

    def __repr__(self) -> str:
        return f"<Source [{self.reliability}] {self.source_type}>"
