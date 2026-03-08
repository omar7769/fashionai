from enum import Enum
from typing import Optional

from pydantic import BaseModel


class CategoryEnum(str, Enum):
    top = "top"
    bottom = "bottom"
    outerwear = "outerwear"
    shoes = "shoes"
    accessory = "accessory"


class SeasonEnum(str, Enum):
    spring = "spring"
    summer = "summer"
    fall = "fall"
    winter = "winter"
    all_season = "all-season"


class FormalityEnum(str, Enum):
    casual = "casual"
    smart_casual = "smart-casual"
    business = "business"
    formal = "formal"


class OccasionEnum(str, Enum):
    casual = "casual"
    work = "work"
    date_night = "date-night"
    formal = "formal"


class WardrobeItemBase(BaseModel):
    user_id: str
    image_url: str
    clean_image_url: Optional[str] = None
    category: str
    color: str
    season: str
    formality: str


class WardrobeItemResponse(WardrobeItemBase):
    id: str

    class Config:
        from_attributes = True


class WardrobeItemUpdate(BaseModel):
    category: Optional[CategoryEnum] = None
    color: Optional[str] = None
    season: Optional[SeasonEnum] = None
    formality: Optional[FormalityEnum] = None


class AnalyzeImageResponse(BaseModel):
    category: Optional[str] = None
    color: Optional[str] = None
    season: Optional[str] = None
    formality: Optional[str] = None
    description: Optional[str] = None


class OutfitSuggestion(BaseModel):
    top: Optional[WardrobeItemResponse] = None
    bottom: Optional[WardrobeItemResponse] = None
    outerwear: Optional[WardrobeItemResponse] = None
    shoes: Optional[WardrobeItemResponse] = None
    accessories: list[WardrobeItemResponse] = []
    score: int = 0
    explanation: str = ""


class WeatherInfo(BaseModel):
    temp_f: int = 0
    condition: str = ""
    description: str = ""
    city: str = ""


class OutfitResponse(BaseModel):
    suggestions: list[OutfitSuggestion] = []
    weather: Optional[WeatherInfo] = None


class SaveOutfitRequest(BaseModel):
    user_id: str
    outfit: OutfitSuggestion


class SavedOutfitResponse(BaseModel):
    id: str
    user_id: str
    outfit: OutfitSuggestion
    created_at: str

    class Config:
        from_attributes = True
