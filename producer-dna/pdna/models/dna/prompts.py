from typing import Optional, TYPE_CHECKING
from sqlalchemy import Text, BigInteger, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from pdna.models.producers import Producer


class PromptExport(Base, TimestampMixin):
    __tablename__ = "prompt_exports"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id", ondelete="CASCADE"), nullable=False
    )
    prompt_type: Mapped[str] = mapped_column(String(50), nullable=False)
    prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
    model_target: Mapped[Optional[str]] = mapped_column(String(100))
    version: Mapped[int] = mapped_column(Integer, default=1)

    producer: Mapped["Producer"] = relationship("Producer", back_populates="prompt_exports")

    def __repr__(self) -> str:
        return f"<PromptExport [{self.prompt_type}] for producer_id={self.producer_id}>"
