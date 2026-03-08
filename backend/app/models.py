from sqlalchemy import Column, DateTime, String, Text, func

from .database import Base


class WardrobeItem(Base):
    __tablename__ = "wardrobe_items"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    image_url = Column(String, nullable=False)
    clean_image_url = Column(String, nullable=True)
    category = Column(String, nullable=False)
    color = Column(String, nullable=False)
    season = Column(String, nullable=False)
    formality = Column(String, nullable=False)


class SavedOutfit(Base):
    __tablename__ = "saved_outfits"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    outfit_data = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
