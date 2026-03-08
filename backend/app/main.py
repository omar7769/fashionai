import json
import os
import uuid
from typing import Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import logging

from . import crud, image_processing, models, schemas, storage, vision, weather
from .config import ENABLE_REMBG, SUPABASE_BUCKET
from .database import Base, engine, get_db

logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Wardrobe API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/analyze-image", response_model=schemas.AnalyzeImageResponse)
async def analyze_image(image: UploadFile = File(...)):
    image_bytes = await image.read()
    mime = image.content_type or "image/jpeg"
    result = vision.analyze_image(image_bytes, mime)
    if result is None:
        raise HTTPException(
            status_code=422,
            detail="Could not analyze image. Check that OPENAI_API_KEY is set.",
        )
    return result


@app.post("/items", response_model=schemas.WardrobeItemResponse)
async def create_item(
    user_id: str = Form(...),
    category: schemas.CategoryEnum = Form(...),
    color: str = Form(...),
    season: schemas.SeasonEnum = Form(...),
    formality: schemas.FormalityEnum = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    image_bytes = await image.read()
    content_type = image.content_type or "image/jpeg"
    extension = os.path.splitext(image.filename or "")[1] or ".jpg"
    base_name = str(uuid.uuid4())
    filename = f"{base_name}{extension}"

    image_url = storage.upload_image(filename, image_bytes, content_type)
    if not image_url:
        raise HTTPException(status_code=500, detail="Image upload failed")

    # Attempt background removal
    clean_image_url = None
    if ENABLE_REMBG:
        cleaned = image_processing.remove_background(image_bytes)
        if cleaned:
            clean_filename = f"{base_name}_clean.png"
            clean_image_url = storage.upload_image(clean_filename, cleaned, "image/png")
            if clean_image_url:
                logger.info("Background removed: %s", clean_filename)
        if not clean_image_url:
            logger.warning("Background removal failed, using original image")

    return crud.create_item(
        db=db,
        user_id=user_id,
        image_url=image_url,
        clean_image_url=clean_image_url,
        category=category.value,
        color=color,
        season=season.value,
        formality=formality.value,
    )


@app.get("/items", response_model=list[schemas.WardrobeItemResponse])
def list_items(user_id: Optional[str] = Query(default=None), db: Session = Depends(get_db)):
    return crud.get_items(db=db, user_id=user_id)


@app.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: str, db: Session = Depends(get_db)):
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    try:
        for url in [item.image_url, item.clean_image_url]:
            if url and SUPABASE_BUCKET in url:
                fname = url.split(f"{SUPABASE_BUCKET}/")[-1]
                storage.delete_image(fname)
    except Exception:
        pass
    crud.delete_item(db, item)
    return Response(status_code=204)


@app.patch("/items/{item_id}", response_model=schemas.WardrobeItemResponse)
def update_item(item_id: str, data: schemas.WardrobeItemUpdate, db: Session = Depends(get_db)):
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return crud.update_item(db, item, data)


@app.post("/generate-outfit", response_model=schemas.OutfitResponse)
def generate_outfit(
    user_id: str = Form(...),
    occasion: schemas.OccasionEnum = Form(...),
    city: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
):
    items = crud.get_items(db=db, user_id=user_id)

    weather_info = None
    temp_f = None
    if city:
        weather_info = weather.get_weather(city)
        if weather_info:
            temp_f = weather_info["temp_f"]

    result = crud.generate_outfit(items, occasion.value, temp_f=temp_f)
    if weather_info:
        result["weather"] = weather_info

    # Enhance each suggestion with an AI stylist explanation (non-blocking fallback)
    for suggestion in result["suggestions"]:
        ai_explanation = vision.stylist_explain(suggestion, occasion.value, temp_f)
        if ai_explanation:
            suggestion["explanation"] = ai_explanation

    return result


@app.post("/saved-outfits", response_model=schemas.SavedOutfitResponse)
def save_outfit(data: schemas.SaveOutfitRequest, db: Session = Depends(get_db)):
    outfit_json = data.outfit.json()
    saved = crud.save_outfit(db, data.user_id, outfit_json)
    return {
        "id": saved.id,
        "user_id": saved.user_id,
        "outfit": json.loads(saved.outfit_data),
        "created_at": saved.created_at.isoformat(),
    }


@app.get("/saved-outfits", response_model=list[schemas.SavedOutfitResponse])
def list_saved_outfits(user_id: str = Query(...), db: Session = Depends(get_db)):
    rows = crud.get_saved_outfits(db, user_id)
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "outfit": json.loads(r.outfit_data),
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@app.delete("/saved-outfits/{outfit_id}", status_code=204)
def delete_saved_outfit(outfit_id: str, db: Session = Depends(get_db)):
    from .models import SavedOutfit
    outfit = db.query(SavedOutfit).filter(SavedOutfit.id == outfit_id).first()
    if not outfit:
        raise HTTPException(status_code=404, detail="Saved outfit not found")
    crud.delete_saved_outfit(db, outfit)
    return Response(status_code=204)
