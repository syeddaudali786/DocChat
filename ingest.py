"""Chunk data/profile.md by section, embed each chunk, save the index."""
import json
import re
from pathlib import Path

import numpy as np
from fastembed import TextEmbedding

MODEL = "BAAI/bge-small-en-v1.5"
SRC = Path("data/profile.md")
OUT = Path("index")


def chunk(text: str) -> list[str]:
    """One chunk per '## ' section, with the heading kept for context."""
    parts = re.split(r"(?m)^## ", text)
    chunks = []
    for part in parts[1:]:
        heading, _, body = part.partition("\n")
        body = body.strip()
        if body:
            chunks.append(f"{heading.strip()}\n{body}")
    return chunks


def main() -> None:
    chunks = chunk(SRC.read_text(encoding="utf-8"))
    model = TextEmbedding(model_name=MODEL)
    vectors = np.array(list(model.embed(chunks)), dtype="float32")
    vectors /= np.linalg.norm(vectors, axis=1, keepdims=True)
    OUT.mkdir(exist_ok=True)
    np.save(OUT / "vectors.npy", vectors)
    (OUT / "chunks.json").write_text(json.dumps(chunks, indent=2), encoding="utf-8")
    print(f"Saved {len(chunks)} chunks, vector shape {vectors.shape}")


if __name__ == "__main__":
    main()
