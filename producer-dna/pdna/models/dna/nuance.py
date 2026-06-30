from typing import Optional, TYPE_CHECKING
from sqlalchemy import Text, BigInteger, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base

if TYPE_CHECKING:
    from pdna.models.producers import Producer


class StyleNuanceMap(Base):
    __tablename__ = "style_nuance_map"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id"), unique=True, nullable=False
    )
    casual_listener: Mapped[Optional[str]] = mapped_column(Text)
    producer_ear: Mapped[Optional[str]] = mapped_column(Text)
    engineer_ear: Mapped[Optional[str]] = mapped_column(Text)
    artist_ear: Mapped[Optional[str]] = mapped_column(Text)
    dj_ear: Mapped[Optional[str]] = mapped_column(Text)
    beginner_ear: Mapped[Optional[str]] = mapped_column(Text)
    confidence: Mapped[str] = mapped_column(String(10), default="D")

    producer: Mapped["Producer"] = relationship("Producer", back_populates="style_nuance")

    def __repr__(self) -> str:
        return f"<StyleNuanceMap producer_id={self.producer_id}>"
