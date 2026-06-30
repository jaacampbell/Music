from typing import Optional, TYPE_CHECKING
from sqlalchemy import Text, BigInteger, SmallInteger, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from pdna.models.producers import Producer


class InspiredDirection(Base, TimestampMixin):
    __tablename__ = "inspired_directions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    direction_text: Mapped[str] = mapped_column(Text, nullable=False)
    direction_type: Mapped[Optional[str]] = mapped_column(String(50))
    sort_order: Mapped[Optional[int]] = mapped_column(SmallInteger)

    producer: Mapped["Producer"] = relationship("Producer", back_populates="inspired_directions")

    def __repr__(self) -> str:
        return f"<InspiredDirection '{self.title}'>"


class CreativeIteration(Base, TimestampMixin):
    __tablename__ = "creative_iterations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id", ondelete="CASCADE"), nullable=False
    )
    iteration_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(500))
    prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
    target_context: Mapped[Optional[str]] = mapped_column(String(100))

    producer: Mapped["Producer"] = relationship("Producer", back_populates="creative_iterations")

    __table_args__ = (
        UniqueConstraint("producer_id", "iteration_number", name="creative_iter_unique"),
    )

    def __repr__(self) -> str:
        return f"<CreativeIteration #{self.iteration_number}>"
