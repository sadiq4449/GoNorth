from datetime import datetime

from pydantic import BaseModel, Field


class PromoCampaignOut(BaseModel):
    id: str
    title: str
    message: str
    valley: str | None
    discount_label: str
    cta_url: str
    cta_label: str
    season: str
    active: bool
    starts_at: datetime | None
    ends_at: datetime | None
    sort_order: int

    class Config:
        from_attributes = True


class PromoCampaignUpsert(BaseModel):
    id: str | None = None
    title: str = Field(min_length=3)
    message: str = Field(min_length=5)
    valley: str | None = None
    discount_label: str = ""
    cta_url: str = "/plan"
    cta_label: str = "Book now"
    season: str = "off-season"
    active: bool = True
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    sort_order: int = 0
