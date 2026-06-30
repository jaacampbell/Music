from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, SmallInteger, Boolean, Text, BigInteger, Index, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pdna.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from pdna.models.works import Credit
    from pdna.models.sources import Source
    from pdna.models.gear import GearClaim
    from pdna.models.edges import CollaboratorEdge, InfluenceEdge
    from pdna.models.dna.profiles import ProducerProfile
    from pdna.models.dna.sonic import SonicDNA
    from pdna.models.dna.rhythmic import RhythmicDNA
    from pdna.models.dna.melodic import MelodicHarmonicDNA
    from pdna.models.dna.arrangement import ArrangementDNA
    from pdna.models.dna.mixing import MixingDNA
    from pdna.models.dna.sampling import SamplingDNA
    from pdna.models.dna.nuance import StyleNuanceMap
    from pdna.models.dna.creative import InspiredDirection, CreativeIteration
    from pdna.models.dna.warnings import OriginalityWarning
    from pdna.models.dna.fusions import FusionPath
    from pdna.models.dna.prompts import PromptExport


class Producer(Base, TimestampMixin):
    __tablename__ = "producers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    pdna_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    real_name: Mapped[Optional[str]] = mapped_column(String(500))
    country: Mapped[Optional[str]] = mapped_column(String(2))
    city: Mapped[Optional[str]] = mapped_column(String(200))
    region: Mapped[Optional[str]] = mapped_column(String(200))
    active_from: Mapped[Optional[int]] = mapped_column(SmallInteger)
    active_to: Mapped[Optional[int]] = mapped_column(SmallInteger)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    official_links: Mapped[Optional[dict]] = mapped_column(JSONB, default=list)
    primary_scenes: Mapped[Optional[list]] = mapped_column(JSONB, default=list)
    musicbrainz_id: Mapped[Optional[str]] = mapped_column(String(40))
    wikidata_id: Mapped[Optional[str]] = mapped_column(String(20))
    discogs_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    search_vector: Mapped[Optional[str]] = mapped_column(TSVECTOR)

    aliases: Mapped[list["ProducerAlias"]] = relationship(
        "ProducerAlias", back_populates="producer", cascade="all, delete-orphan"
    )
    credits: Mapped[list["Credit"]] = relationship("Credit", back_populates="producer")
    sources: Mapped[list["Source"]] = relationship("Source", back_populates="producer")
    gear_claims: Mapped[list["GearClaim"]] = relationship("GearClaim", back_populates="producer")
    outgoing_collabs: Mapped[list["CollaboratorEdge"]] = relationship(
        "CollaboratorEdge", foreign_keys="CollaboratorEdge.from_producer_id", back_populates="from_producer"
    )
    outgoing_influences: Mapped[list["InfluenceEdge"]] = relationship(
        "InfluenceEdge", foreign_keys="InfluenceEdge.from_producer_id", back_populates="from_producer"
    )
    profile: Mapped[Optional["ProducerProfile"]] = relationship(
        "ProducerProfile", uselist=False, back_populates="producer"
    )
    sonic_dna: Mapped[Optional["SonicDNA"]] = relationship(
        "SonicDNA", uselist=False, back_populates="producer"
    )
    rhythmic_dna: Mapped[Optional["RhythmicDNA"]] = relationship(
        "RhythmicDNA", uselist=False, back_populates="producer"
    )
    melodic_dna: Mapped[Optional["MelodicHarmonicDNA"]] = relationship(
        "MelodicHarmonicDNA", uselist=False, back_populates="producer"
    )
    arrangement_dna: Mapped[Optional["ArrangementDNA"]] = relationship(
        "ArrangementDNA", uselist=False, back_populates="producer"
    )
    mixing_dna: Mapped[Optional["MixingDNA"]] = relationship(
        "MixingDNA", uselist=False, back_populates="producer"
    )
    sampling_dna: Mapped[Optional["SamplingDNA"]] = relationship(
        "SamplingDNA", uselist=False, back_populates="producer"
    )
    style_nuance: Mapped[Optional["StyleNuanceMap"]] = relationship(
        "StyleNuanceMap", uselist=False, back_populates="producer"
    )
    inspired_directions: Mapped[list["InspiredDirection"]] = relationship(
        "InspiredDirection", back_populates="producer", cascade="all, delete-orphan"
    )
    creative_iterations: Mapped[list["CreativeIteration"]] = relationship(
        "CreativeIteration", back_populates="producer", cascade="all, delete-orphan"
    )
    originality_warnings: Mapped[list["OriginalityWarning"]] = relationship(
        "OriginalityWarning", back_populates="producer", cascade="all, delete-orphan"
    )
    fusion_paths: Mapped[list["FusionPath"]] = relationship(
        "FusionPath", foreign_keys="FusionPath.primary_producer_id", back_populates="primary_producer"
    )
    prompt_exports: Mapped[list["PromptExport"]] = relationship(
        "PromptExport", back_populates="producer", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("producers_search_gin", "search_vector", postgresql_using="gin"),
        Index("producers_country_idx", "country"),
        Index("producers_active_from_idx", "active_from"),
    )

    def __repr__(self) -> str:
        return f"<Producer {self.pdna_id}: {self.name}>"


class ProducerAlias(Base):
    __tablename__ = "producer_aliases"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    producer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("producers.id", ondelete="CASCADE"), nullable=False
    )
    alias: Mapped[str] = mapped_column(String(500), nullable=False)
    alias_type: Mapped[Optional[str]] = mapped_column(String(50))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    producer: Mapped["Producer"] = relationship("Producer", back_populates="aliases")

    __table_args__ = (
        Index("aliases_producer_idx", "producer_id"),
    )

    def __repr__(self) -> str:
        return f"<Alias {self.alias}>"
