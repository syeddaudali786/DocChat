"""fastembed model, loaded once per process; vectors are L2-normalised for cosine search."""
from functools import lru_cache

import numpy as np
from fastembed import TextEmbedding

from app.core.config import get_settings


class Embedder:
    def __init__(self, model_name: str) -> None:
        self.model = TextEmbedding(model_name=model_name)

    def embed(self, texts: list[str]) -> np.ndarray:
        vectors = np.array(list(self.model.embed(texts)), dtype="float32")
        vectors /= np.linalg.norm(vectors, axis=1, keepdims=True)
        return vectors


@lru_cache
def get_embedder() -> Embedder:
    return Embedder(get_settings().embedding_model)
