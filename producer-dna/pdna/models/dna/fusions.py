from typing import Optional, TYPE_CHECKING
from sqlalchemy import Text, BigInteger, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from pdna.models.producers import Producer


class FusionPath(Base, TimestampMixin):
    __tablename__ = "fusion_paths"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    primary_producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id"), nullable=False
    )
    secondary_element: Mapped[str] = mapped_column(String(500), nullable=False)
    secondary_producer_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("producers.id"))
    fusion_description: Mapped[str] = mapped_column(Text, nullable=False)
    creative_prompt: Mapped[Optional[str]] = mapped_column(Text)

    primary_producer: Mapped["Producer"] = relationship(
        "Producer", foreign_keys=[primary_producer_id], back_populates="fusion_paths"
    )
    secondary_producer: Mapped[Optional["Producer"]] = relationship(
        "Producer", foreign_keys=[secondary_producer_id]
    )

    def __repr__(self) -> str:
        return f"<FusionPath '{self.secondary_element}'>"
