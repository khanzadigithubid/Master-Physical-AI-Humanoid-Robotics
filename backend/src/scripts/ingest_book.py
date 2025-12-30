#!/usr/bin/env python3
"""
Book content ingestion script.

Ingests markdown files from book/docs/ into Qdrant vector database.

Usage:
    python -m src.scripts.ingest_book
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.services.ingestion_service import ingestion_service
import structlog

logger = structlog.get_logger()


async def main():
    """Run book ingestion."""
    try:
        logger.info("=" * 80)
        logger.info("BOOK INGESTION STARTING")
        logger.info("=" * 80)

        result = await ingestion_service.ingest_book()

        logger.info("=" * 80)
        logger.info("BOOK INGESTION COMPLETE")
        logger.info(
            "Summary",
            files_processed=result["files_processed"],
            total_chunks=result["total_chunks"],
        )
        logger.info("=" * 80)

        print(f"\n[SUCCESS] Ingested {result['files_processed']} files, {result['total_chunks']} chunks\n")

    except Exception as e:
        logger.error("Ingestion failed", error=str(e))
        print(f"\n[ERROR] {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
