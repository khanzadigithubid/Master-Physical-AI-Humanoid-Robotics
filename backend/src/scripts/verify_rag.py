import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.services.rag_service import rag_service
from src.config import settings

async def verify_rag():
    print("=" * 80)
    print("VERIFYING RAG QUERY FUNCTIONALITY")
    print("=" * 80)

    query = "What is the definition of Physical AI?"
    print(f"\n[1] Query: {query}")

    try:
        # Step 1: Embed Query
        print("[2] Embedding query...")
        vector = await rag_service.embed_query(query)
        print(f"    Success! Vector dimension: {len(vector)}")

        # Step 2: Search Vector Database
        print("[3] Searching vector database (Qdrant)...")
        chunks = await rag_service.search_full_book(vector, top_k=3)
        print(f"    Found {len(chunks)} chunks.")
        for i, chunk in enumerate(chunks):
            print(f"    - Chunk {i+1}: Chapter '{chunk['chapter']}', Score: {chunk['score']:.4f}")

        if not chunks:
            print("    [!] No chunks found. Ensure you ran the ingestion script.")
            return

        # Step 3: Build Prompt
        print("[4] Building prompt...")
        prompt = rag_service.build_prompt(query, chunks, mode="full-book")
        print("    Success!")

        # Step 4: Generate Answer
        print("[5] Generating answer via Gemini...")
        result = await rag_service.generate_answer(prompt)
        print("\n[RESULT]")
        print("-" * 40)
        print(result['answer'])
        print("-" * 40)

        # Step 5: Citations and Confidence
        citations = rag_service.extract_citations(chunks)
        confidence = rag_service.calculate_confidence(chunks)
        print(f"\n[METADATA]")
        print(f"    Confidence: {confidence}")
        print(f"    Citations found: {len(citations)}")

        print("\n\u2705 RAG verification COMPLETE\n")

    except Exception as e:
        print(f"\n\u274c Error during verification: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_rag())
