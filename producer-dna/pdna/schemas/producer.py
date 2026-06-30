from typing import Optional
from pydantic import BaseModel, field_validator


VALID_TIERS = {"A", "B", "C", "D", "E", "Unknown"}
VALID_ALIAS_TYPES = {
    "group_name", "collective", "production_team", "label_identity", "solo_alias", "colloquial"
}


class AliasSchema(BaseModel):
    alias: str
    alias_type: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("alias_type")
    @classmethod
    def validate_alias_type(cls, v):
        if v and v not in VALID_ALIAS_TYPES:
            raise ValueError(f"alias_type must be one of {VALID_ALIAS_TYPES}")
        return v


class OfficialLinkSchema(BaseModel):
    type: str
    url: str


class ProducerSchema(BaseModel):
    pdna_id: str
    name: str
    real_name: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    active_from: Optional[int] = None
    active_to: Optional[int] = None
    is_active: bool = True
    official_links: list[OfficialLinkSchema] = []
    primary_scenes: list[str] = []
    aliases: list[AliasSchema] = []
    musicbrainz_id: Optional[str] = None
    wikidata_id: Optional[str] = None
    discogs_id: Optional[int] = None
    notes: Optional[str] = None

    @field_validator("pdna_id")
    @classmethod
    def validate_pdna_id(cls, v):
        import re
        if not re.match(r"^PDNA-\d{6}$", v):
            raise ValueError(f"pdna_id must match PDNA-NNNNNN, got: {v}")
        return v

    @field_validator("country")
    @classmethod
    def validate_country(cls, v):
        if v and len(v) != 2:
            raise ValueError("country must be ISO 3166-1 alpha-2 (2 chars)")
        return v.upper() if v else v
