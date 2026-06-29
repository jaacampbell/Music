from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, SmallInteger, Integer, BigInteger, Text, Boolean, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from pdna.models.producers import Producer
    from pdna.models.sources import Source


class Work(Base, TimestampMixin):
    __tablename__ = "works"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    title: Mapped[str] = mapped_column(String(1000), nullable=False)
    work_type: Mapped[str] = mapped_column(String(30), nullable=False)
    release_year: Mapped[Optional[int]] = mapped_column(SmallInteger)
    artist: Mapped[Optional[str]] = mapped_column(String(500))
    label: Mapped[Optional[str]] = mapped_column(String(500))
    country: Mapped[Optional[str]] = mapped_column(String(2))
    musicbrainz_id: Mapped[Optional[str]] = mapped_column(String(40))
    discogs_id: Mapped[Optional[int]] = mapped_column(Integer)
    isrc: Mapped[Optional[str]] = mapped_column(String(15))
    upc: Mapped[Optional[str]] = mapped_column(String(20))
    search_vector: Mapped[Optional[str]] = mapped_column(TSVECTOR)

    credits: Mapped[list["Credit"]] = relationship(
        "Credit", back_populates="work", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("works_search_gin", "search_vector", postgresql_using="gin"),
        Index("works_release_year_idx", "release_year"),
        Index(
            "works_mb_id_uidx", "musicbrainz_id",
            unique=True,
            postgresql_where=("musicbrainz_id IS NOT NULL"),
        ),
    )

    def __repr__(self) -> str:
        return f"<Work '{self.title}' ({self.release_year})>"


class Credit(Base):
    __tablename__ = "credits"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id", ondelete="CASCADE"), nullable=False
    )
    work_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("works.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    confidence: Mapped[str] = mapped_column(String(10), default="Unknown")
    notes: Mapped[Optional[str]] = mapped_column(Text)

    producer: Mapped["Producer"] = relationship("Producer", back_populates="credits")
    work: Mapped["Work"] = relationship("Work", back_populates="credits")

    __table_args__ = (
        UniqueConstraint("producer_id", "work_id", "role", name="credits_unique"),
        Index("credits_producer_idx", "producer_id"),
        Index("credits_work_idx", "work_id"),
        Index("credits_role_idx", "role"),
    )

    def __repr__(self) -> str:
        return f"<Credit {self.role} on work_id={self.work_id}>"
