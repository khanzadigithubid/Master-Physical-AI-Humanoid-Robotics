"""
Qdrant vector database client.

Handles vector storage, retrieval, and search operations for RAG.
"""

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from typing import List, Dict, Any, Optional
import structlog

from src.config import settings

logger = structlog.get_logger()


class QdrantService:
    """Service for interacting with Qdrant Cloud."""

    def __init__(self):
        """Initialize Qdrant client."""
        self.client = AsyncQdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
        )
        self.collection_name = settings.QDRANT_COLLECTION_NAME

    async def create_collection(self, force_recreate: bool = False):
        """Create Qdrant collection if it doesn't exist or dimension mismatch."""
        try:
            # Check if collection exists
            collections = await self.client.get_collections()
            collection_names = [col.name for col in collections.collections]

            if self.collection_name in collection_names:
                # Check current configuration
                col_info = await self.client.get_collection(self.collection_name)
                current_dim = col_info.config.params.vectors.size

                if current_dim == settings.EMBEDDING_DIMENSION and not force_recreate:
                    logger.info("Collection exists with correct dimensions", collection=self.collection_name, dimension=current_dim)
                    return

                logger.warning("Dimension mismatch or force recreate detected. Deleting collection.",
                               collection=self.collection_name,
                               current_dim=current_dim,
                               expected_dim=settings.EMBEDDING_DIMENSION)
                await self.client.delete_collection(self.collection_name)

            # Create collection
            await self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=settings.EMBEDDING_DIMENSION,
                    distance=Distance.COSINE,
                ),
            )

            logger.info("Collection created successfully", collection=self.collection_name, dimension=settings.EMBEDDING_DIMENSION)

        except Exception as e:
            logger.error("Failed to create collection", error=str(e))
            raise

    async def upsert_chunks(self, chunks: List[Dict[str, Any]]):
        """
        Insert or update chunks in Qdrant.

        Args:
            chunks: List of chunk dictionaries with keys:
                - id: Unique chunk ID (hash of content)
                - vector: Embedding vector (list of floats)
                - payload: Metadata (content, chapter, section, etc.)
        """
        try:
            points = [
                PointStruct(
                    id=chunk["id"],
                    vector=chunk["vector"],
                    payload=chunk["payload"]
                )
                for chunk in chunks
            ]

            await self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )

            logger.info("Upserted chunks", count=len(chunks))

        except Exception as e:
            logger.error("Failed to upsert chunks", error=str(e))
            raise

    async def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        score_threshold: float = 0.7,
        filter_conditions: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for similar chunks.

        Args:
            query_vector: Query embedding vector
            top_k: Number of results to return
            score_threshold: Minimum similarity score
            filter_conditions: Optional metadata filters (e.g., {"chapter": "02-robotics-fundamentals"})

        Returns:
            List of search results with score, payload
        """
        try:
            # Build filter
            query_filter = None
            if filter_conditions:
                conditions = [
                    FieldCondition(
                        key=key,
                        match=MatchValue(value=value)
                    )
                    for key, value in filter_conditions.items()
                ]
                query_filter = Filter(must=conditions)

            # Search (using query_points for qdrant-client >= 1.16)
            results = await self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                limit=top_k,
                score_threshold=score_threshold,
                query_filter=query_filter,
            )

            logger.info("Raw search result type", type=str(type(results)))
            points = results.points
            logger.info("Points attribute type", type=str(type(points)))

            if points:
                logger.info("First point type", type=str(type(points[0])))

            # Format results
            formatted_results = []
            for hit in points:
                # Handle different return types
                if isinstance(hit, tuple):
                    # Unpack tuple: (id, score, payload) or similar
                    if len(hit) >= 3:
                        point_id, score, payload = hit[0], hit[1], hit[2]
                    elif len(hit) == 2:
                        point_id, score = hit[0], hit[1]
                        payload = {}
                    else:
                        point_id, score, payload = hit[0], 0.0, {}
                else:
                    # Assume object with attributes
                    point_id = getattr(hit, 'id', None)
                    score = getattr(hit, 'score', 0.0)
                    payload = getattr(hit, 'payload', {})

                formatted_results.append({
                    "id": point_id,
                    "score": score,
                    "content": payload.get("content", ""),
                    "chapter": payload.get("chapter", ""),
                    "section": payload.get("section", ""),
                    "file_path": payload.get("file_path", ""),
                    "chunk_index": payload.get("chunk_index", 0),
                })

            logger.info("Search completed", results_count=len(formatted_results))

            return formatted_results

        except Exception as e:
            logger.error("Search failed", error=str(e))
            raise

    async def count_chunks(self) -> int:
        """Get total number of chunks in collection."""
        try:
            info = await self.client.get_collection(self.collection_name)
            return info.points_count
        except Exception as e:
            logger.error("Failed to count chunks", error=str(e))
            return 0


# Global Qdrant service instance
qdrant_service = QdrantService()
