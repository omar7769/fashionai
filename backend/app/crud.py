import uuid
from collections import defaultdict
from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from .models import SavedOutfit, WardrobeItem
from . import schemas

# Occasion → ordered list of preferred formalities (first = strongest preference)
OCCASION_FORMALITIES: dict[str, list[str]] = {
    "casual":     ["casual"],
    "work":       ["smart-casual", "business"],
    "date-night": ["smart-casual", "casual"],
    "formal":     ["formal"],
}

NEUTRAL_COLORS = {
    "black", "white", "grey", "gray", "navy", "beige", "cream",
    "tan", "brown", "khaki", "charcoal", "ivory", "off-white", "camel",
}


def _current_season() -> str:
    month = date.today().month
    if month in (3, 4, 5):
        return "spring"
    if month in (6, 7, 8):
        return "summer"
    if month in (9, 10, 11):
        return "fall"
    return "winter"


def _score(
    item: WardrobeItem,
    preferred_formalities: list[str],
    season: str,
    temp_f: Optional[int] = None,
) -> int:
    score = 0
    # Formality match — highest weight; earlier in list = stronger match
    if item.formality in preferred_formalities:
        idx = preferred_formalities.index(item.formality)
        score += 20 - idx * 2          # first pref = 20, second = 18
    # Season match
    if item.season == season:
        score += 8
    elif item.season == "all-season":
        score += 5
    # Neutral color — easier to mix and match
    if item.color.lower() in NEUTRAL_COLORS:
        score += 2
    # Weather-aware adjustments
    if temp_f is not None:
        cat = item.category.lower()
        if temp_f < 55:
            # Cold: boost outerwear and winter/fall items
            if cat == "outerwear":
                score += 10
            if item.season in ("winter", "fall"):
                score += 4
        elif temp_f > 70:
            # Warm: penalize outerwear, boost summer/spring items
            if cat == "outerwear":
                score -= 8
            if item.season in ("summer", "spring"):
                score += 4
    return score


def create_item(
    db: Session,
    user_id: str,
    image_url: str,
    category: str,
    color: str,
    season: str,
    formality: str,
    clean_image_url: Optional[str] = None,
) -> WardrobeItem:
    item = WardrobeItem(
        id=str(uuid.uuid4()),
        user_id=user_id,
        image_url=image_url,
        clean_image_url=clean_image_url,
        category=category,
        color=color,
        season=season,
        formality=formality,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_item(db: Session, item_id: str) -> Optional[WardrobeItem]:
    return db.query(WardrobeItem).filter(WardrobeItem.id == item_id).first()


def delete_item(db: Session, item: WardrobeItem) -> None:
    db.delete(item)
    db.commit()


def update_item(db: Session, item: WardrobeItem, data: "schemas.WardrobeItemUpdate") -> WardrobeItem:
    if data.category is not None:
        item.category = data.category.value
    if data.color is not None:
        item.color = data.color
    if data.season is not None:
        item.season = data.season.value
    if data.formality is not None:
        item.formality = data.formality.value
    db.commit()
    db.refresh(item)
    return item


def get_items(db: Session, user_id: Optional[str] = None) -> list[WardrobeItem]:
    query = db.query(WardrobeItem)
    if user_id:
        query = query.filter(WardrobeItem.user_id == user_id)
    return query.all()


def _ranked(category: str, grouped: dict, preferred_formalities: list, season: str, temp_f: Optional[int] = None) -> list:
    """Return items for a category sorted by score descending."""
    candidates = grouped.get(category, [])
    return sorted(candidates, key=lambda i: _score(i, preferred_formalities, season, temp_f), reverse=True)


def _build_explanation(occasion: str, season: str, preferred_formalities: list, picks: dict, temp_f: Optional[int] = None) -> str:
    lines: list[str] = [
        f"Occasion: {occasion} — targeting {' or '.join(preferred_formalities)} formality.",
        f"Season: {season}.",
    ]
    if temp_f is not None:
        if temp_f < 55:
            lines.append(f"Weather: {temp_f}°F — layering up.")
        elif temp_f > 70:
            lines.append(f"Weather: {temp_f}°F — keeping it light.")
        else:
            lines.append(f"Weather: {temp_f}°F — mild conditions.")
    for slot_name in ["top", "bottom", "outerwear", "shoes"]:
        item = picks.get(slot_name)
        if item is None:
            lines.append(f"No {slot_name} in your closet.")
        else:
            s = _score(item, preferred_formalities, season, temp_f)
            lines.append(f"{slot_name.capitalize()}: {item.color} {item.category} ({item.formality}, score {s}).")
    return " ".join(lines)


def _outfit_key(picks: dict) -> tuple:
    """Create a hashable key from the item IDs in an outfit to detect duplicates."""
    return tuple(
        (picks.get(cat).id if picks.get(cat) else None)
        for cat in ["top", "bottom", "outerwear", "shoes"]
    )


def generate_outfit(items: list[WardrobeItem], occasion: str, temp_f: Optional[int] = None) -> dict:
    preferred_formalities = OCCASION_FORMALITIES[occasion]
    season = _current_season()

    grouped: dict[str, list[WardrobeItem]] = defaultdict(list)
    for item in items:
        grouped[item.category.lower()].append(item)

    ranked_tops = _ranked("top", grouped, preferred_formalities, season, temp_f)
    ranked_bottoms = _ranked("bottom", grouped, preferred_formalities, season, temp_f)
    ranked_outerwear = _ranked("outerwear", grouped, preferred_formalities, season, temp_f)
    ranked_shoes = _ranked("shoes", grouped, preferred_formalities, season, temp_f)
    accessories = grouped.get("accessory", [])

    # Generate up to 3 distinct outfits by varying top and bottom picks
    seen_keys: set = set()
    suggestions: list = []

    # Try combinations: vary top (up to 3) x bottom (up to 3), pick best outerwear/shoes
    for top in (ranked_tops[:3] or [None]):
        for bottom in (ranked_bottoms[:3] or [None]):
            if len(suggestions) >= 3:
                break

            # For outerwear and shoes, pick the best that differs from higher-ranked outfits
            # if possible, otherwise use the top-ranked one
            ow = ranked_outerwear[0] if ranked_outerwear else None
            sh = ranked_shoes[0] if ranked_shoes else None

            picks = {"top": top, "bottom": bottom, "outerwear": ow, "shoes": sh}
            key = _outfit_key(picks)

            if key in seen_keys:
                continue
            seen_keys.add(key)

            # Calculate total outfit score
            total = sum(
                _score(picks[cat], preferred_formalities, season, temp_f)
                for cat in ["top", "bottom", "outerwear", "shoes"]
                if picks[cat]
            )

            explanation = _build_explanation(occasion, season, preferred_formalities, picks, temp_f)

            suggestions.append({
                "top": top,
                "bottom": bottom,
                "outerwear": ow,
                "shoes": sh,
                "accessories": accessories,
                "score": total,
                "explanation": explanation,
            })
        if len(suggestions) >= 3:
            break

    # If we still have fewer than 3 (limited wardrobe), try varying outerwear/shoes
    if len(suggestions) < 3 and len(suggestions) > 0:
        base = suggestions[0]
        for ow in ranked_outerwear[1:3]:
            if len(suggestions) >= 3:
                break
            picks = {"top": base["top"], "bottom": base["bottom"], "outerwear": ow, "shoes": base["shoes"]}
            key = _outfit_key(picks)
            if key in seen_keys:
                continue
            seen_keys.add(key)
            total = sum(
                _score(picks[cat], preferred_formalities, season, temp_f)
                for cat in ["top", "bottom", "outerwear", "shoes"]
                if picks[cat]
            )
            suggestions.append({
                **picks,
                "accessories": accessories,
                "score": total,
                "explanation": _build_explanation(occasion, season, preferred_formalities, picks, temp_f),
            })

    # Sort by score descending
    suggestions.sort(key=lambda s: s["score"], reverse=True)

    return {"suggestions": suggestions}


def save_outfit(db: Session, user_id: str, outfit_json: str) -> SavedOutfit:
    outfit = SavedOutfit(
        id=str(uuid.uuid4()),
        user_id=user_id,
        outfit_data=outfit_json,
    )
    db.add(outfit)
    db.commit()
    db.refresh(outfit)
    return outfit


def get_saved_outfits(db: Session, user_id: str) -> list[SavedOutfit]:
    return (
        db.query(SavedOutfit)
        .filter(SavedOutfit.user_id == user_id)
        .order_by(SavedOutfit.created_at.desc())
        .all()
    )


def delete_saved_outfit(db: Session, outfit: SavedOutfit) -> None:
    db.delete(outfit)
    db.commit()
