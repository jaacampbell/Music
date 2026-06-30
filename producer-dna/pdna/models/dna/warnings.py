from typing import Optional, TYPE_CHECKING
from sqlalchemy import Text, BigInteger, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base

if TYPE_CHECKING:
    from pdna.models.producers import Producer


class OriginalityWarning(Base):
    __tablename__ = "originality_warnings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id", ondelete="CASCADE"), nullable=False
    )
    warning_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="moderate")

    producer: Mapped["Producer"] = relationship("Producer", back_populates="originality_warnings")

    def __repr__(self) -> str:
        return f"<OriginalityWarning [{self.severity}] {self.warning_type}>"
