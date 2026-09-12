import hashlib

import numpy as np

from app.config import EMBEDDING_DIM, OPENAI_API_KEY, USE_REAL_EMBEDDINGS


def _mock_embedding(text: str) -> list[float]:
    """Deterministic pseudo-embedding: same text -> same vector, unit-normalized.

    Not semantically meaningful, but stable and cosine-similarity-comparable,
    which is all the matching pipeline needs while running without an API key.
    """
    seed = int(hashlib.sha256(text.encode("utf-8")).hexdigest(), 16) % (2**32)
    rng = np.random.default_rng(seed)
    vec = rng.normal(size=EMBEDDING_DIM)
    vec = vec / np.linalg.norm(vec)
    return vec.tolist()


async def _real_embedding(text: str) -> list[float]:
    import httpx

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.openai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={"model": "text-embedding-3-small", "input": text},
        )
        resp.raise_for_status()
        data = resp.json()
        return data["data"][0]["embedding"]


async def embed(text: str) -> list[float]:
    if USE_REAL_EMBEDDINGS:
        return await _real_embedding(text)
    return _mock_embedding(text)


def cosine_similarity(a: list[float], b: list[float]) -> float:
    va, vb = np.array(a), np.array(b)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    if denom == 0:
        return 0.0
    return float(np.dot(va, vb) / denom)
