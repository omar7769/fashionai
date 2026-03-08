import logging
from typing import Optional

from rembg import remove

logger = logging.getLogger(__name__)


def remove_background(image_bytes: bytes) -> Optional[bytes]:
    """Remove background from an image. Returns PNG bytes or None on failure."""
    try:
        return remove(image_bytes)
    except Exception:
        logger.exception("Background removal failed")
        return None
