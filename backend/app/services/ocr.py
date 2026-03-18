from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, UploadFile, status

try:
    from google.cloud import vision
except ImportError:  # pragma: no cover - optional dependency
    vision = None

from ..config import get_settings


class OCRService:
    """Wrapper around Google Vision API."""

    def __init__(self) -> None:
        settings = get_settings()
        self._google_client = None
        if vision and settings.google_application_credentials:
            self._google_client = vision.ImageAnnotatorClient()

    async def extract_text(self, file: UploadFile) -> str:
        """Extract text from an uploaded file."""
        settings = get_settings()
        content = await file.read()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file uploaded"
            )
        
        # Try real Google Vision if configured
        if self._google_client:
            text = self._extract_with_google(content)
            if text:
                return text

        # Fallback to mock if enabled
        if settings.use_mock_ocr:
            return f"[MOCK OCR DATA for {file.filename}]: This is a simulated handwritten response extracted via OCR."

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Vision is not configured and USE_MOCK_OCR is false.",
        )

    def _extract_with_google(self, data: bytes) -> Optional[str]:
        if not self._google_client:
            return None
        image = vision.Image(content=data)
        response = self._google_client.document_text_detection(image=image)
        if response.error.message:
            return None
        return response.full_text_annotation.text.strip()


