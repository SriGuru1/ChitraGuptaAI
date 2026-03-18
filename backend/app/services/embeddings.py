from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer

from ..config import get_settings


@lru_cache
def _get_model() -> SentenceTransformer:
    settings = get_settings()
    return SentenceTransformer(settings.embedding_model_name)


class EmbeddingService:
    """Generate embeddings and compute cosine similarity."""

    def __init__(self) -> None:
        self._model = _get_model()

    def embed(self, text: str) -> np.ndarray:
        return np.array(self._model.encode(text, convert_to_numpy=True))

    def cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        if not a.any() or not b.any():
            return 0.0
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


