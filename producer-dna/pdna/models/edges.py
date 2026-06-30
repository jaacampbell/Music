from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, SmallInteger, Integer, Text, BigInteger, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base

if TYPE_CHECKING:
    from pdna.models.producers import Producer


class CollaboratorEdge(Base):
    __tablename__ = "collaborator_edges"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    from_producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id"), nullable=False
    )
    to_entity_type: Mapped[str] = mapped_column(String(30), nullable=False)
    to_producer_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("producers.id"))
    to_entity_name: Mapped[Optional[str]] = mapped_column(String(500))
    edge_type: Mapped[str] = mapped_column(String(50), nullable=False)
    strength: Mapped[Optional[int]] = mapped_column(SmallInteger)
    work_count: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    from_producer: Mapped["Producer"] = relationship(
        "Producer", foreign_keys=[from_producer_id], back_populates="outgoing_collabs"
    )
    to_producer: Mapped[Optional["Producer"]] = relationship(
        "Producer", foreign_keys=[to_producer_id]
    )

    __table_args__ = (
        Index("collab_from_idx", "from_producer_id"),
        Index(
            "collab_to_prod_idx", "to_producer_id",
            postgresql_where=("to_producer_id IS NOT NULL"),
        ),
    )

    def __repr__(self) -> str:
        return f"<CollaboratorEdge {self.edge_type} → {self.to_entity_name}>"


class InfluenceEdge(Base):
    __tablename__ = "influence_edges"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    from_producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id"), nullable=False
    )
    to_producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id"), nullable=False
    )
    direction: Mapped[str] = mapped_column(String(30), nullable=False)
    confidence: Mapped[str] = mapped_column(String(10), default="Unknown")
    strength: Mapped[Optional[int]] = mapped_column(SmallInteger)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    from_producer: Mapped["Producer"] = relationship(
        "Producer", foreign_keys=[from_producer_id], back_populates="outgoing_influences"
    )
    to_producer: Mapped["Producer"] = relationship(
        "Producer", foreign_keys=[to_producer_id]
    )

    __table_args__ = (
        UniqueConstraint("from_producer_id", "to_producer_id", "direction", name="influence_unique"),
        Index("influence_from_idx", "from_producer_id"),
        Index("influence_to_idx", "to_producer_id"),
    )

    def __repr__(self) -> str:
        return f"<InfluenceEdge {self.direction} to producer_id={self.to_producer_id}>"
