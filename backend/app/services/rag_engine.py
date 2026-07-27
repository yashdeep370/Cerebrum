"""A pure-Python TF-IDF / cosine-similarity vector store.

Chunks live in the same relational database as everything else (no local disk,
no separate service), so it works unmodified whether that DB is SQLite on a
single box or free hosted Postgres on a serverless host with an ephemeral
filesystem. Swap this module for a real vector DB (Chroma/Pinecone/Weaviate)
once embedding-quality matters more than zero-friction, disk-independent setup.
"""

import math
import re
from collections import Counter

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.models import DocumentChunk

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def _build_idf(tokenized_chunks: list[list[str]]) -> dict[str, float]:
    doc_freq: Counter[str] = Counter()
    for tokens in tokenized_chunks:
        doc_freq.update(set(tokens))
    n_docs = len(tokenized_chunks)
    return {term: math.log((1 + n_docs) / (1 + freq)) + 1 for term, freq in doc_freq.items()}


def _vectorize(tokens: list[str], idf: dict[str, float]) -> dict[str, float]:
    term_freq = Counter(tokens)
    length = len(tokens) or 1
    vec = {term: (count / length) * idf.get(term, 0.0) for term, count in term_freq.items()}
    norm = math.sqrt(sum(weight * weight for weight in vec.values())) or 1.0
    return {term: weight / norm for term, weight in vec.items()}


def _cosine(vec_a: dict[str, float], vec_b: dict[str, float]) -> float:
    shorter, longer = (vec_a, vec_b) if len(vec_a) <= len(vec_b) else (vec_b, vec_a)
    return sum(weight * longer.get(term, 0.0) for term, weight in shorter.items())


def add_chunks(db: Session, document_id: str, chunks: list[str]) -> None:
    for i, text in enumerate(chunks):
        db.add(DocumentChunk(document_id=document_id, chunk_index=i, text=text))
    db.commit()


def delete_document(db: Session, document_id: str) -> None:
    db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document_id))
    db.commit()


def query(db: Session, document_id: str, question: str, top_k: int = 4) -> list[dict]:
    rows = db.scalars(
        select(DocumentChunk).where(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index)
    ).all()
    if not rows:
        return []

    tokenized_chunks = [_tokenize(row.text) for row in rows]
    idf = _build_idf(tokenized_chunks)
    chunk_vectors = [_vectorize(tokens, idf) for tokens in tokenized_chunks]
    query_vector = _vectorize(_tokenize(question), idf)

    ranked = sorted(range(len(rows)), key=lambda i: _cosine(query_vector, chunk_vectors[i]), reverse=True)
    return [{"chunk_index": rows[i].chunk_index, "text": rows[i].text} for i in ranked[:top_k]]


def query_all(db: Session, question: str, top_k: int = 6) -> list[dict]:
    """Searches across every indexed document. Used for library-wide chat."""
    rows = db.scalars(select(DocumentChunk)).all()
    if not rows:
        return []

    tokenized_chunks = [_tokenize(row.text) for row in rows]
    idf = _build_idf(tokenized_chunks)
    chunk_vectors = [_vectorize(tokens, idf) for tokens in tokenized_chunks]
    query_vector = _vectorize(_tokenize(question), idf)

    ranked = sorted(range(len(rows)), key=lambda i: _cosine(query_vector, chunk_vectors[i]), reverse=True)
    return [
        {"document_id": rows[i].document_id, "chunk_index": rows[i].chunk_index, "text": rows[i].text}
        for i in ranked[:top_k]
    ]
