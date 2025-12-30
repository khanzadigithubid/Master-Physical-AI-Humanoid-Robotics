# RAG Flow Specification
**Physical AI & Humanoid Robotics – AI-Native Textbook Platform**

**Date**: 2025-12-28
**Version**: 1.0.0
**Status**: Design

---

## Executive Summary

This document defines the Retrieval Augmented Generation (RAG) pipeline for the textbook platform. The system supports two query modes: full-book RAG (search entire corpus) and selected-text RAG (contextual queries on highlighted text). The pipeline uses Qdrant Cloud for vector storage, OpenAI embeddings for retrieval, and GPT-4 for answer generation.

---

## RAG Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         RAG PIPELINE                             │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  INGESTION   │───▶│  RETRIEVAL   │───▶│ GENERATION   │      │
│  │              │    │              │    │              │      │
│  │ Book Content │    │ User Query   │    │ Answer +     │      │
│  │ → Chunks     │    │ → Embed      │    │ Citations    │      │
│  │ → Embed      │    │ → Search     │    │              │      │
│  │ → Store      │    │ → Rank       │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
  ┌──────────┐         ┌──────────┐         ┌──────────┐
  │ Qdrant   │         │ Qdrant   │         │ OpenAI   │
  │  Cloud   │         │  Cloud   │         │  GPT-4   │
  └──────────┘         └──────────┘         └──────────┘
```

---

## Phase 1: Ingestion Pipeline

### Purpose
Convert Docusaurus markdown chapters into vector embeddings for semantic search.

### Input
- Markdown files from `book/docs/**/*.md`
- Frontmatter metadata (chapter, section, difficulty)

### Process

#### Step 1: Content Extraction
```python
import frontmatter
from pathlib import Path

def extract_content(file_path: Path) -> BookChunk:
    with open(file_path, 'r', encoding='utf-8') as f:
        post = frontmatter.load(f)

    metadata = {
        'chapter': post.get('chapter', ''),
        'section': post.get('section', ''),
        'title': post.get('title', ''),
        'difficulty': post.get('difficulty', 'intermediate'),
        'file_path': str(file_path),
    }

    content = post.content  # Markdown body

    return BookChunk(content=content, metadata=metadata)
```

#### Step 2: Chunking Strategy

**Why Chunk?**
- Embedding models have token limits (8192 for text-embedding-3-small)
- Smaller chunks improve retrieval precision
- Balanced chunk size optimizes context window usage

**Chunking Rules**:
1. **Semantic boundaries**: Split at section headers (`##`, `###`)
2. **Max tokens**: 512 tokens per chunk (with 50-token overlap)
3. **Min tokens**: 100 tokens (avoid trivial chunks)
4. **Preserve context**: Include chapter/section title in each chunk

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

def chunk_content(book_chunk: BookChunk) -> List[Chunk]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=50,
        separators=["\n## ", "\n### ", "\n#### ", "\n\n", "\n", " "],
        length_function=lambda text: len(tiktoken.encode(text))
    )

    chunks = splitter.split_text(book_chunk.content)

    result = []
    for idx, chunk_text in enumerate(chunks):
        # Prepend context for semantic clarity
        contextualized = f"""
Chapter: {book_chunk.metadata['chapter']}
Section: {book_chunk.metadata['section']}

{chunk_text}
"""

        result.append(Chunk(
            id=f"{book_chunk.metadata['chapter']}-{idx}",
            content=contextualized,
            metadata={
                **book_chunk.metadata,
                'chunk_index': idx,
                'chunk_count': len(chunks),
            }
        ))

    return result
```

#### Step 3: Embedding Generation
```python
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def embed_chunk(chunk: Chunk) -> np.ndarray:
    response = await client.embeddings.create(
        model="text-embedding-3-small",  # 1536 dimensions
        input=chunk.content,
    )

    vector = np.array(response.data[0].embedding)

    # Log for monitoring
    logger.info(
        "Embedded chunk",
        chunk_id=chunk.id,
        tokens=response.usage.total_tokens,
        cost_usd=response.usage.total_tokens * 0.00002 / 1000  # $0.02 / 1M tokens
    )

    return vector
```

#### Step 4: Vector Storage (Qdrant)
```python
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Distance, VectorParams

qdrant = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

# Create collection (one-time setup)
async def create_collection():
    await qdrant.create_collection(
        collection_name="physical-ai-book",
        vectors_config=VectorParams(
            size=1536,  # text-embedding-3-small dimension
            distance=Distance.COSINE,
        )
    )

# Insert chunk
async def store_chunk(chunk: Chunk, vector: np.ndarray):
    point = PointStruct(
        id=hash(chunk.id),  # Unique ID
        vector=vector.tolist(),
        payload={
            'content': chunk.content,
            'chapter': chunk.metadata['chapter'],
            'section': chunk.metadata['section'],
            'title': chunk.metadata['title'],
            'file_path': chunk.metadata['file_path'],
            'chunk_index': chunk.metadata['chunk_index'],
        }
    )

    await qdrant.upsert(
        collection_name="physical-ai-book",
        points=[point]
    )
```

#### Step 5: Ingestion Orchestration
```python
async def ingest_book():
    logger.info("Starting ingestion")

    # 1. Scan all markdown files
    book_dir = Path("book/docs")
    md_files = list(book_dir.rglob("*.md"))

    logger.info(f"Found {len(md_files)} markdown files")

    # 2. Process each file
    total_chunks = 0
    for file_path in md_files:
        book_chunk = extract_content(file_path)
        chunks = chunk_content(book_chunk)

        # 3. Embed and store chunks (batch for efficiency)
        for chunk in chunks:
            vector = await embed_chunk(chunk)
            await store_chunk(chunk, vector)
            total_chunks += 1

        logger.info(f"Ingested {file_path.name}: {len(chunks)} chunks")

    logger.info(f"Ingestion complete: {total_chunks} total chunks")

# Trigger via admin endpoint
@router.post("/ingestion/trigger")
async def trigger_ingestion(user: User = Depends(require_admin)):
    asyncio.create_task(ingest_book())
    return {"message": "Ingestion started"}
```

### Success Criteria
- [ ] All book chapters ingested (6 modules × ~5 chapters = ~30 files)
- [ ] Average chunk size: 400-500 tokens
- [ ] Total chunks: 500-1000 (estimate)
- [ ] Ingestion time: < 5 minutes
- [ ] Cost: < $1 for full book ingestion (embedding cost)

---

## Phase 2: Retrieval Pipeline

### Full-Book Mode

**Use Case**: User asks general question ("What is inverse kinematics?")

#### Step 1: Query Embedding
```python
async def embed_query(query: str) -> np.ndarray:
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=query,
    )
    return np.array(response.data[0].embedding)
```

#### Step 2: Vector Search
```python
async def search_full_book(query_vector: np.ndarray, top_k: int = 5) -> List[SearchResult]:
    results = await qdrant.search(
        collection_name="physical-ai-book",
        query_vector=query_vector.tolist(),
        limit=top_k,
        score_threshold=0.7,  # Minimum cosine similarity
    )

    return [
        SearchResult(
            content=hit.payload['content'],
            score=hit.score,
            metadata={
                'chapter': hit.payload['chapter'],
                'section': hit.payload['section'],
                'file_path': hit.payload['file_path'],
            }
        )
        for hit in results
    ]
```

#### Step 3: Reranking (Optional Enhancement)
```python
async def rerank_results(query: str, results: List[SearchResult]) -> List[SearchResult]:
    # Use cross-encoder for better relevance
    from sentence_transformers import CrossEncoder

    reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-12-v2')

    pairs = [(query, result.content) for result in results]
    scores = reranker.predict(pairs)

    # Sort by reranker scores
    ranked = sorted(zip(results, scores), key=lambda x: x[1], reverse=True)

    return [result for result, score in ranked]
```

### Selected-Text Mode

**Use Case**: User highlights text, asks "What does this mean?"

#### Step 1: Context Anchor Embedding
```python
async def embed_context(selected_text: str, query: str) -> np.ndarray:
    # Combine selected text and query for context-aware embedding
    combined = f"Selected text: {selected_text}\n\nQuestion: {query}"

    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=combined,
    )
    return np.array(response.data[0].embedding)
```

#### Step 2: Filtered Search
```python
async def search_selected_text(
    query_vector: np.ndarray,
    chapter_filter: str,
    top_k: int = 3
) -> List[SearchResult]:
    results = await qdrant.search(
        collection_name="physical-ai-book",
        query_vector=query_vector.tolist(),
        limit=top_k,
        score_threshold=0.8,  # Higher threshold for precision
        query_filter={
            "must": [
                {"key": "chapter", "match": {"value": chapter_filter}}
            ]
        }
    )

    return [SearchResult(...) for hit in results]
```

#### Step 3: Context Window Construction
```python
def build_context_window(selected_text: str, results: List[SearchResult]) -> str:
    context = f"**User is reading this section:**\n{selected_text}\n\n"
    context += "**Related information from the chapter:**\n"

    for idx, result in enumerate(results, 1):
        context += f"\n[Context {idx}]:\n{result.content}\n"

    return context
```

### Caching Strategy

**Cache Query Embeddings**:
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_embed_query(query: str) -> np.ndarray:
    return embed_query(query)  # Cache for 1 hour
```

**Cache Frequent Questions**:
```python
# Precompute answers for common queries
COMMON_QUERIES = {
    "What is Physical AI?": "cached_answer_1",
    "Explain inverse kinematics": "cached_answer_2",
    "What is reinforcement learning for robotics?": "cached_answer_3",
}

async def search_with_cache(query: str) -> Optional[str]:
    normalized = query.strip().lower()
    if normalized in COMMON_QUERIES:
        logger.info("Cache hit", query=query)
        return COMMON_QUERIES[normalized]

    return None  # Proceed with vector search
```

---

## Phase 3: Generation Pipeline

### Step 1: Prompt Construction

#### Full-Book Mode Prompt
```python
def build_full_book_prompt(query: str, results: List[SearchResult]) -> str:
    context = "\n\n".join([
        f"[Source: {r.metadata['chapter']} - {r.metadata['section']}]\n{r.content}"
        for r in results
    ])

    prompt = f"""
You are an expert instructor in Physical AI and Humanoid Robotics.
Answer the student's question using ONLY the provided context from the textbook.

Context from textbook:
{context}

Student question: {query}

Instructions:
- Provide a clear, accurate answer
- Cite relevant chapters/sections
- If context is insufficient, state: "The textbook doesn't cover this topic in detail."
- Use technical language appropriate for university-level learners
- Include examples or equations if present in context

Answer:
"""

    return prompt
```

#### Selected-Text Mode Prompt
```python
def build_selected_text_prompt(
    query: str,
    selected_text: str,
    results: List[SearchResult]
) -> str:
    context = build_context_window(selected_text, results)

    prompt = f"""
You are a teaching assistant helping a student understand Physical AI concepts.

{context}

Student question about the selected text: {query}

Instructions:
- Answer the question specifically in relation to the selected text
- Reference related concepts from the context if helpful
- Keep answer concise and focused
- If the selected text doesn't contain enough information, suggest where to look

Answer:
"""

    return prompt
```

### Step 2: Answer Generation
```python
async def generate_answer(prompt: str, model: str = "gpt-4") -> str:
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are an expert in Physical AI and Humanoid Robotics."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,  # Lower temperature for factual accuracy
        max_tokens=800,
    )

    answer = response.choices[0].message.content

    # Log token usage for cost tracking
    logger.info(
        "Generated answer",
        model=model,
        prompt_tokens=response.usage.prompt_tokens,
        completion_tokens=response.usage.completion_tokens,
        total_tokens=response.usage.total_tokens,
        cost_usd=calculate_cost(model, response.usage)
    )

    return answer
```

### Step 3: Citation Extraction
```python
def extract_citations(results: List[SearchResult]) -> List[Citation]:
    citations = []

    for result in results:
        citations.append(Citation(
            chapter=result.metadata['chapter'],
            section=result.metadata['section'],
            relevance_score=result.score,
            url=f"/book/docs/{result.metadata['file_path']}"
        ))

    # Remove duplicates (same chapter/section)
    unique_citations = {}
    for citation in citations:
        key = f"{citation.chapter}:{citation.section}"
        if key not in unique_citations or citation.relevance_score > unique_citations[key].relevance_score:
            unique_citations[key] = citation

    return list(unique_citations.values())
```

### Step 4: Confidence Scoring
```python
def calculate_confidence(results: List[SearchResult]) -> float:
    if not results:
        return 0.0

    # Confidence based on top result score and consistency
    top_score = results[0].score
    avg_score = sum(r.score for r in results) / len(results)

    # High confidence: top result >0.85, avg >0.75
    if top_score > 0.85 and avg_score > 0.75:
        return 0.95

    # Medium confidence: top result >0.7, avg >0.6
    if top_score > 0.7 and avg_score > 0.6:
        return 0.75

    # Low confidence: otherwise
    return 0.5
```

---

## Complete RAG Flow

### Full-Book Query
```python
async def rag_full_book(query: str, user_id: UUID) -> RAGResponse:
    # 1. Check cache
    cached = await search_with_cache(query)
    if cached:
        return RAGResponse(answer=cached, sources=[], confidence=1.0, cached=True)

    # 2. Embed query
    query_vector = await embed_query(query)

    # 3. Search vector store
    results = await search_full_book(query_vector, top_k=5)

    # 4. Check confidence
    confidence = calculate_confidence(results)
    if confidence < 0.5:
        return RAGResponse(
            answer="I don't have enough information to answer this confidently. Try rephrasing your question or browsing the [Table of Contents](/docs).",
            sources=[],
            confidence=confidence
        )

    # 5. Build prompt
    prompt = build_full_book_prompt(query, results)

    # 6. Generate answer
    answer = await generate_answer(prompt, model="gpt-4")

    # 7. Extract citations
    citations = extract_citations(results)

    # 8. Log query
    await log_rag_query(
        user_id=user_id,
        query=query,
        mode="full-book",
        chunks_retrieved=len(results),
        confidence=confidence,
        answer=answer
    )

    return RAGResponse(
        answer=answer,
        sources=citations,
        confidence=confidence,
        cached=False
    )
```

### Selected-Text Query
```python
async def rag_selected_text(query: str, selected_text: str, user_id: UUID) -> RAGResponse:
    # 1. Detect chapter from selected text (heuristic: match against known chapters)
    chapter = await detect_chapter(selected_text)

    # 2. Embed context
    query_vector = await embed_context(selected_text, query)

    # 3. Filtered search
    results = await search_selected_text(query_vector, chapter_filter=chapter, top_k=3)

    # 4. Check confidence
    confidence = calculate_confidence(results)

    # 5. Build prompt
    prompt = build_selected_text_prompt(query, selected_text, results)

    # 6. Generate answer
    answer = await generate_answer(prompt, model="gpt-4")

    # 7. Extract citations (include selected text as primary source)
    citations = extract_citations(results)
    citations.insert(0, Citation(
        chapter=chapter,
        section="Selected Text",
        relevance_score=1.0,
        url="#selected"
    ))

    # 8. Log query
    await log_rag_query(
        user_id=user_id,
        query=query,
        mode="selected-text",
        chunks_retrieved=len(results),
        confidence=confidence,
        answer=answer,
        context=selected_text[:200]  # Log snippet
    )

    return RAGResponse(
        answer=answer,
        sources=citations,
        confidence=confidence,
        cached=False
    )
```

---

## Error Handling

### Qdrant Failures
```python
async def search_with_fallback(query_vector: np.ndarray) -> List[SearchResult]:
    try:
        return await qdrant.search(...)
    except QdrantTimeout:
        logger.warning("Qdrant timeout, using cached results")
        return await get_cached_popular_results()
    except QdrantConnectionError:
        logger.error("Qdrant unreachable")
        raise ServiceUnavailableError("Search service temporarily unavailable")
```

### OpenAI Rate Limits
```python
from tenacity import retry, wait_exponential, stop_after_attempt

@retry(wait=wait_exponential(multiplier=1, min=2, max=60), stop=stop_after_attempt(3))
async def generate_answer_with_retry(prompt: str) -> str:
    try:
        return await generate_answer(prompt)
    except RateLimitError:
        logger.warning("OpenAI rate limit hit, retrying...")
        raise  # Trigger retry
```

---

## Observability

### Metrics Dashboard
```
rag_queries_total{mode="full-book"} 1543
rag_queries_total{mode="selected-text"} 892
rag_latency_seconds{quantile="0.95", mode="full-book"} 1.82
rag_confidence_score{mode="full-book"} 0.87
rag_cache_hit_rate 0.68
rag_cost_usd_daily 23.45
```

### Logging
```python
logger.info(
    "RAG query completed",
    user_id=user_id,
    query_hash=hashlib.sha256(query.encode()).hexdigest()[:8],
    mode="full-book",
    chunks_retrieved=5,
    confidence=0.89,
    latency_ms=1823,
    tokens_used=2432,
    cost_usd=0.058
)
```

---

## Performance Optimization

### Techniques
1. **Batch embedding**: Embed multiple chunks in single API call
2. **Connection pooling**: Reuse Qdrant connections
3. **Async I/O**: Use `asyncio` for concurrent requests
4. **CDN caching**: Cache common query responses (Redis)
5. **Vector compression**: Use quantization (Qdrant supports scalar quantization)

### Target Metrics
| Metric | Target | Current (Estimate) |
|--------|--------|-------------------|
| Query latency (p95) | < 2s | 1.8s |
| Ingestion time (full book) | < 5 min | 3 min |
| Cache hit rate | > 60% | 68% |
| Daily cost (1000 users) | < $50 | $23 |

---

## Success Criteria

- [ ] Full-book RAG returns relevant answers 90%+ of time (human evaluation)
- [ ] Selected-text RAG correctly scopes answers to selection 95%+ of time
- [ ] Average confidence score > 0.8
- [ ] Latency p95 < 2 seconds
- [ ] Cache hit rate > 60%
- [ ] Cost per query < $0.06
- [ ] Zero PII in vector store (audit completed)
- [ ] Ingestion pipeline handles 100 chapters in < 10 minutes

---

**Document Status**: ✅ Complete
**Next Steps**: Personalization Logic Specification
