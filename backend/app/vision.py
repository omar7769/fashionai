import base64
import json
import logging
from typing import Optional

from openai import OpenAI

from .config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

ANALYZE_PROMPT = """Analyze this clothing image and return a JSON object with exactly these fields:
- "category": one of "top", "bottom", "outerwear", "shoes", "accessory"
- "color": the primary color as a single lowercase word (e.g. "black", "navy", "white")
- "season": one of "spring", "summer", "fall", "winter", "all-season"
- "formality": one of "casual", "smart-casual", "business", "formal"
- "description": a short 5-10 word description of the clothing item

Return ONLY valid JSON. No markdown, no explanation."""

STYLIST_PROMPT = """You are a fashion stylist. Given an outfit and occasion, write 1-2 sentences explaining why this outfit works well together. Be specific about colors, textures, and how the pieces complement each other. Keep it concise and natural.

Outfit:
{items}
Occasion: {occasion}
{weather_line}
Write your explanation:"""

VALID_CATEGORIES = {"top", "bottom", "outerwear", "shoes", "accessory"}
VALID_SEASONS = {"spring", "summer", "fall", "winter", "all-season"}
VALID_FORMALITIES = {"casual", "smart-casual", "business", "formal"}


def analyze_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> Optional[dict]:
    """Send image to OpenAI Vision and return validated clothing attributes."""
    if not OPENAI_API_KEY:
        return None

    client = OpenAI(api_key=OPENAI_API_KEY)
    b64 = base64.b64encode(image_bytes).decode()

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": ANALYZE_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime_type};base64,{b64}"},
                        },
                    ],
                }
            ],
            max_tokens=200,
        )
    except Exception:
        logger.exception("OpenAI API call failed")
        return None

    text = response.choices[0].message.content.strip()

    # Strip markdown code fences if the model wraps the JSON
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        logger.warning("OpenAI returned non-JSON: %s", text[:200])
        return None

    # Validate each field against allowed enums; set to None if invalid
    cat = str(data.get("category", "")).lower()
    sea = str(data.get("season", "")).lower()
    fmt = str(data.get("formality", "")).lower()

    return {
        "category": cat if cat in VALID_CATEGORIES else None,
        "color": str(data.get("color", "")).lower() or None,
        "season": sea if sea in VALID_SEASONS else None,
        "formality": fmt if fmt in VALID_FORMALITIES else None,
        "description": str(data.get("description", "")) or None,
    }


def stylist_explain(outfit_items: dict, occasion: str, temp_f: Optional[int] = None) -> Optional[str]:
    """Generate a short AI stylist explanation for an outfit. Returns None on failure."""
    if not OPENAI_API_KEY:
        return None

    lines = []
    for slot in ["top", "bottom", "outerwear", "shoes"]:
        item = outfit_items.get(slot)
        if item:
            lines.append(f"{slot.capitalize()}: {item.color} {item.category} ({item.formality})")
    accessories = outfit_items.get("accessories", [])
    for acc in accessories:
        lines.append(f"Accessory: {acc.color} {acc.category}")

    if not lines:
        return None

    weather_line = ""
    if temp_f is not None:
        weather_line = f"Weather: {temp_f}°F"

    prompt = STYLIST_PROMPT.format(
        items="\n".join(lines),
        occasion=occasion,
        weather_line=weather_line,
    )

    client = OpenAI(api_key=OPENAI_API_KEY)
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        logger.exception("Stylist explanation failed")
        return None
