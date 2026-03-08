import logging
from typing import Optional

import requests

from .config import OPENWEATHER_API_KEY

logger = logging.getLogger(__name__)

OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"


def get_weather(city: str) -> Optional[dict]:
    """Fetch current weather for a city. Returns dict with temp_f, condition, description or None."""
    if not OPENWEATHER_API_KEY:
        logger.warning("OPENWEATHER_API_KEY not set")
        return None

    try:
        resp = requests.get(
            OPENWEATHER_URL,
            params={"q": city, "appid": OPENWEATHER_API_KEY, "units": "imperial"},
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()

        temp_f = data["main"]["temp"]
        condition = data["weather"][0]["main"]  # e.g. "Clear", "Rain", "Clouds"
        description = data["weather"][0]["description"]  # e.g. "light rain"

        return {
            "temp_f": round(temp_f),
            "condition": condition,
            "description": description,
            "city": data.get("name", city),
        }
    except Exception:
        logger.exception("Weather API call failed for city=%s", city)
        return None
