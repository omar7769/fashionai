import logging
from typing import Optional

from supabase import create_client

from .config import SUPABASE_BUCKET, SUPABASE_SERVICE_KEY, SUPABASE_URL

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    global _client
    if _client is None and SUPABASE_URL and SUPABASE_SERVICE_KEY:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client


def upload_image(filename: str, data: bytes, content_type: str = "image/jpeg") -> Optional[str]:
    """Upload image bytes to Supabase Storage. Returns public URL or None."""
    client = _get_client()
    if not client:
        logger.error("Supabase client not configured")
        return None
    try:
        client.storage.from_(SUPABASE_BUCKET).upload(
            filename, data, {"content-type": content_type}
        )
        return client.storage.from_(SUPABASE_BUCKET).get_public_url(filename)
    except Exception:
        logger.exception("Failed to upload %s to Supabase Storage", filename)
        return None


def delete_image(filename: str) -> None:
    """Delete an image from Supabase Storage."""
    client = _get_client()
    if not client:
        return
    try:
        client.storage.from_(SUPABASE_BUCKET).remove([filename])
    except Exception:
        logger.exception("Failed to delete %s from Supabase Storage", filename)
