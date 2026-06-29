from typing import Optional
from sqlalchemy import String, SmallInteger, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base


class Era(Base):
    __tablename__ = "eras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    year_start: Mapped[Optional[int]] = mapped_column(SmallInteger)
    year_end: Mapped[Optional[int]] = mapped_column(SmallInteger)
    sort_order: Mapped[Optional[int]] = mapped_column(SmallInteger)

    def __repr__(self) -> str:
        return f"<Era {self.code}>"


class Genre(Base):
    __tablename__ = "genres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("genres.id"))
    fma_id: Mapped[Optional[int]] = mapped_column(Integer)
    mb_genre: Mapped[Optional[str]] = mapped_column(String(200))
    region: Mapped[Optional[str]] = mapped_column(String(100))
    era_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("eras.id"))

    parent: Mapped[Optional["Genre"]] = relationship("Genre", remote_side="Genre.id")
    children: Mapped[list["Genre"]] = relationship("Genre", back_populates="parent")

    def __repr__(self) -> str:
        return f"<Genre {self.code}>"


class ProducerRole(Base):
    __tablename__ = "producer_roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    tier: Mapped[Optional[str]] = mapped_column(String(30))

    def __repr__(self) -> str:
        return f"<ProducerRole {self.code}>"
