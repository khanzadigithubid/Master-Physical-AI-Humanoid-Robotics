# AI Architecture Specification
**Physical AI & Humanoid Robotics – AI-Native Textbook Platform**

**Date**: 2025-12-28
**Version**: 1.0.0
**Status**: Design

---

## Executive Summary

This document defines the AI architecture for the textbook platform, focusing on modular, reusable AI agents built with OpenAI Agents SDK and Claude Sub-Agents. The architecture supports RAG (Retrieval Augmented Generation), content personalization, and multilingual translation while maintaining production-grade observability and error handling.

---

## AI Design Principles

1. **Modularity**: Each AI capability (RAG, personalization, translation) implemented as independent service
2. **Composability**: Agents can be chained and orchestrated via OpenAI Agents SDK
3. **Observability**: All agent invocations logged with inputs, outputs, latency, and token usage
4. **Graceful Degradation**: Fallback strategies when AI services unavailable
5. **Cost Control**: Token usage monitored, rate limits enforced, caching strategies applied

---

## Agent Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                               │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │            OpenAI Agents SDK Orchestration                  │  │
│  │                                                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │  │
│  │  │  RAG Agent   │  │ Personalize  │  │  Translate   │     │  │
│  │  │              │  │    Agent     │  │    Agent     │     │  │
│  │  │ - Embed      │  │              │  │              │     │  │
│  │  │ - Retrieve   │  │ - Adapt      │  │ - Preserve   │     │  │
│  │  │ - Generate   │  │ - Contextualize│  │   Terms    │     │  │
│  │  │ - Cite       │  │              │  │ - RTL Format │     │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │         Claude Sub-Agents (Specialized Tasks)         │  │  │
│  │  │                                                        │  │  │
│  │  │  - Technical Term Extraction                          │  │  │
│  │  │  - Context Summarization                              │  │  │
│  │  │  - Answer Validation                                  │  │  │
│  │  │  - Translation Quality Check                          │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Service Layer                            │  │
│  │                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐       │  │
│  │  │ RAG Service │  │Personalize  │  │  Translate   │       │  │
│  │  │             │  │  Service    │  │   Service    │       │  │
│  │  │ - Query     │  │             │  │              │       │  │
│  │  │   Modes     │  │ - User      │  │ - Language   │       │  │
│  │  │ - Caching   │  │   Context   │  │   Detection  │       │  │
│  │  │ - Logging   │  │ - Templates │  │ - Glossary   │       │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘       │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
  ┌─────────────┐      ┌──────────┐        ┌──────────┐
  │   Qdrant    │      │   Neon   │        │  OpenAI  │
  │   Cloud     │      │ Postgres │        │  / Claude│
  │             │      │          │        │   APIs   │
  │ - Vectors   │      │ - Users  │        │          │
  │ - Metadata  │      │ - Prefs  │        │ - GPT-4  │
  │ - Search    │      │ - Cache  │        │ - Claude │
  └─────────────┘      └──────────┘        └──────────┘
```

---

## Agent Specifications

### 1. RAG Agent

**Purpose**: Answer user questions using book content via retrieval augmented generation

**Framework**: OpenAI Agents SDK

**Tools**:
- `embed_query`: Convert text to embedding vector (OpenAI text-embedding-3-small)
- `vector_search`: Query Qdrant for relevant chunks
- `generate_answer`: Generate answer with GPT-4 given context
- `extract_citations`: Parse chunk metadata for source references

**Modes**:

#### Full-Book Mode
```python
class FullBookRAGAgent:
    async def process(self, query: str) -> RAGResponse:
        # Step 1: Embed user query
        query_vector = await self.embed_query(query)

        # Step 2: Search entire book corpus
        chunks = await self.vector_search(
            vector=query_vector,
            collection="physical-ai-book",
            top_k=5,
            score_threshold=0.7
        )

        # Step 3: Construct prompt with retrieved context
        context = self._format_chunks(chunks)
        prompt = f"""
        You are an expert in Physical AI and Humanoid Robotics.

        Context from textbook:
        {context}

        User question: {query}

        Provide a clear, accurate answer citing the relevant chapters.
        """

        # Step 4: Generate answer
        answer = await self.generate_answer(prompt, model="gpt-4")

        # Step 5: Extract citations
        sources = self.extract_citations(chunks)

        # Step 6: Log for observability
        await self.log_query(query, chunks, answer, latency, tokens)

        return RAGResponse(
            answer=answer,
            sources=sources,
            confidence=self._calculate_confidence(chunks)
        )
```

#### Selected-Text Mode
```python
class SelectedTextRAGAgent:
    async def process(self, query: str, selected_text: str) -> RAGResponse:
        # Step 1: Embed selected text (context anchor)
        context_vector = await self.embed_query(selected_text)

        # Step 2: Search near selected text
        chunks = await self.vector_search(
            vector=context_vector,
            collection="physical-ai-book",
            top_k=3,
            score_threshold=0.8,
            filter={"chapter": self._detect_chapter(selected_text)}
        )

        # Step 3: Construct scoped prompt
        prompt = f"""
        The user is reading this section:
        {selected_text}

        Related context:
        {self._format_chunks(chunks)}

        User question: {query}

        Answer the question specifically in the context of the selected text.
        """

        answer = await self.generate_answer(prompt, model="gpt-4")
        sources = self.extract_citations(chunks, include_selection=True)

        return RAGResponse(
            answer=answer,
            sources=sources,
            context="selected-text",
            confidence=self._calculate_confidence(chunks)
        )
```

**Error Handling**:
- Qdrant timeout → Fallback to cached frequent queries
- OpenAI rate limit → Queue request with exponential backoff
- Low confidence score (<0.5) → Return "I don't have enough information" message
- Empty results → Suggest query reformulation

**Observability**:
```python
@observe_agent
async def process(self, query: str) -> RAGResponse:
    with self.tracer.span("rag_query") as span:
        span.set_attributes({
            "query": query[:100],  # Truncate for logging
            "mode": self.mode,
            "user_id": self.user_id
        })

        result = await self._execute_rag(query)

        span.set_attributes({
            "chunks_retrieved": len(result.sources),
            "confidence": result.confidence,
            "tokens_used": result.tokens,
            "latency_ms": span.duration
        })

        return result
```

**Caching Strategy**:
- Cache embedding vectors (query → vector) for 1 hour
- Cache frequent queries (e.g., "What is Physical AI?") for 24 hours
- Cache personalized responses for 30 minutes (user_id + query key)

---

### 2. Personalization Agent

**Purpose**: Adapt chapter content based on user background (software/hardware experience)

**Framework**: OpenAI Agents SDK

**Tools**:
- `fetch_user_profile`: Retrieve user background from Neon
- `fetch_chapter_content`: Get chapter text from Qdrant metadata
- `generate_adaptation`: Generate personalized version with GPT-4
- `identify_modifications`: Track what was changed for transparency

**Personalization Rules**:

| User Background | Adaptation Strategy |
|----------------|---------------------|
| software_background=beginner | Add Python code examples, explain algorithms step-by-step |
| software_background=intermediate | Include pseudocode, reference standard libraries |
| software_background=advanced | Link to research papers, discuss complexity trade-offs |
| hardware_background=none | Explain sensors in layman terms, skip hardware specs |
| hardware_background=hobbyist | Reference Arduino/Raspberry Pi, maker community resources |
| hardware_background=professional | Discuss industrial protocols, real-world deployment constraints |

**Implementation**:
```python
class PersonalizationAgent:
    async def process(self, chapter_id: str, user_id: UUID) -> PersonalizedContent:
        # Step 1: Fetch user profile
        profile = await self.fetch_user_profile(user_id)

        # Step 2: Fetch chapter content
        chapter = await self.fetch_chapter_content(chapter_id)

        # Step 3: Construct personalization prompt
        prompt = f"""
        You are adapting a Physical AI textbook chapter for a learner.

        User background:
        - Software: {profile.software_background}
        - Hardware: {profile.hardware_background}

        Original chapter:
        {chapter.content}

        Personalization instructions:
        {self._get_adaptation_rules(profile)}

        Generate an adapted version that matches the learner's background.
        Preserve all technical accuracy. Mark adaptations with [ADAPTED] tags.
        """

        # Step 4: Generate personalized content
        adapted = await self.generate_adaptation(prompt, model="gpt-4")

        # Step 5: Identify modifications
        modifications = self.identify_modifications(chapter.content, adapted)

        # Step 6: Cache result
        await self.cache_personalization(
            key=f"{user_id}:{chapter_id}",
            value=adapted,
            ttl=1800  # 30 minutes
        )

        return PersonalizedContent(
            chapter_id=chapter_id,
            content=adapted,
            modifications=modifications,
            applied_rules=self._get_adaptation_rules(profile)
        )
```

**Claude Sub-Agent: Context Summarizer**
```python
class ContextSummarizerAgent:
    """Claude-based agent for summarizing user context"""

    async def summarize_background(self, profile: UserProfile) -> str:
        prompt = f"""
        Summarize this learner's background in 2-3 sentences:
        - Software: {profile.software_background}
        - Hardware: {profile.hardware_background}
        - Previous chapters completed: {profile.progress}

        Focus on learning needs and knowledge gaps.
        """

        summary = await claude_api.complete(
            prompt=prompt,
            model="claude-3-5-sonnet-20241022",
            max_tokens=150
        )

        return summary
```

**Transparency**:
- All adaptations logged with modification type (added_example, simplified_explanation, etc.)
- Users can view "Show Original" to see unmodified content
- Modification summary displayed ("3 code examples added, 2 sections simplified")

---

### 3. Translation Agent

**Purpose**: Translate content to Urdu while preserving technical terms

**Framework**: Claude Sub-Agent (better multilingual support than GPT-4)

**Tools**:
- `extract_technical_terms`: Identify terms to preserve in English
- `translate_text`: Translate narrative with Claude
- `format_rtl`: Apply RTL (right-to-left) formatting
- `validate_translation`: Check for technical accuracy

**Implementation**:
```python
class TranslationAgent:
    async def process(self, content: str, target_lang: str = "urdu") -> Translation:
        # Step 1: Extract technical terms (preserve in English)
        terms = await self.extract_technical_terms(content)

        # Step 2: Replace terms with placeholders
        content_with_placeholders, term_map = self._replace_terms(content, terms)

        # Step 3: Translate with Claude
        prompt = f"""
        Translate the following Physical AI textbook content to Urdu.

        CRITICAL: Terms in {{TERM_N}} format are technical terms.
        Keep these placeholders as-is. Do NOT translate them.

        Content:
        {content_with_placeholders}

        Requirements:
        - Natural Urdu prose
        - Preserve markdown formatting
        - Maintain paragraph structure
        - Keep technical placeholders unchanged
        """

        translated = await claude_api.complete(
            prompt=prompt,
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096
        )

        # Step 4: Restore technical terms
        translated_final = self._restore_terms(translated, term_map)

        # Step 5: Format RTL
        formatted = self.format_rtl(translated_final)

        # Step 6: Validate (Claude sub-agent)
        validation = await self.validate_translation(content, formatted, terms)

        return Translation(
            original=content,
            translated=formatted,
            language="urdu",
            preserved_terms=terms,
            validation_score=validation.score,
            warnings=validation.warnings
        )
```

**Claude Sub-Agent: Technical Term Extractor**
```python
class TechnicalTermExtractor:
    async def extract(self, content: str) -> List[str]:
        prompt = f"""
        Extract all technical terms from this Physical AI text that should NOT be translated to Urdu.

        Include:
        - Standard terminology (e.g., "kinematics", "reinforcement learning", "LiDAR")
        - Acronyms (e.g., "IMU", "PID", "ROS")
        - Mathematical symbols/equations
        - Programming terms (e.g., "Python", "numpy", "class")

        Return as JSON array: ["term1", "term2", ...]

        Text:
        {content}
        """

        response = await claude_api.complete(
            prompt=prompt,
            model="claude-3-5-sonnet-20241022",
            max_tokens=500
        )

        terms = json.loads(response)
        return terms
```

**Claude Sub-Agent: Translation Validator**
```python
class TranslationValidator:
    async def validate(self, original: str, translated: str, terms: List[str]) -> ValidationResult:
        prompt = f"""
        Validate this Urdu translation of Physical AI content.

        Original (English):
        {original}

        Translation (Urdu):
        {translated}

        Technical terms (should be unchanged):
        {', '.join(terms)}

        Check:
        1. All technical terms preserved correctly
        2. Meaning accurately conveyed
        3. No mistranslations of key concepts

        Return JSON:
        {{
          "score": 0-100,
          "issues": ["issue1", "issue2"],
          "suggestions": ["suggestion1"]
        }}
        """

        response = await claude_api.complete(
            prompt=prompt,
            model="claude-3-5-sonnet-20241022",
            max_tokens=300
        )

        result = json.loads(response)
        return ValidationResult(**result)
```

**Glossary Management**:
- Maintain term glossary in Neon: `(english_term, urdu_translation, context)`
- Pre-seed with common terms: "robot", "sensor", "algorithm", etc.
- Update glossary when translator makes corrections
- Use glossary for consistent translations

---

## Agent Orchestration Patterns

### Sequential Pattern (Personalization → Translation)
```python
async def personalize_and_translate(chapter_id: str, user_id: UUID, target_lang: str):
    # Step 1: Personalize
    personalized = await personalization_agent.process(chapter_id, user_id)

    # Step 2: Translate personalized content
    translated = await translation_agent.process(personalized.content, target_lang)

    return {
        "content": translated.translated,
        "modifications": personalized.modifications,
        "preserved_terms": translated.preserved_terms
    }
```

### Parallel Pattern (RAG + Context Summarization)
```python
async def enhanced_rag_query(query: str, user_id: UUID):
    # Execute in parallel
    rag_task = asyncio.create_task(rag_agent.process(query))
    context_task = asyncio.create_task(context_summarizer_agent.summarize_background(user_id))

    rag_response, user_context = await asyncio.gather(rag_task, context_task)

    # Enhance answer with user context
    enhanced_answer = f"{rag_response.answer}\n\n[Tailored for: {user_context}]"

    return RAGResponse(
        answer=enhanced_answer,
        sources=rag_response.sources,
        confidence=rag_response.confidence
    )
```

---

## Cost Management

### Token Usage Budgets

| Agent | Model | Avg Tokens/Request | Cost/Request | Daily Budget |
|-------|-------|-------------------|--------------|--------------|
| RAG (full-book) | GPT-4 | 2000 (input) + 500 (output) | $0.06 | 500 requests ($30) |
| RAG (selected-text) | GPT-4 | 1000 + 300 | $0.03 | 1000 requests ($30) |
| Personalization | GPT-4 | 3000 + 1500 | $0.12 | 200 requests ($24) |
| Translation | Claude Sonnet | 2000 + 2000 | $0.024 | 500 requests ($12) |
| **Total** | | | | **$96/day** |

**Cost Control Strategies**:
1. **Caching**: Reduce duplicate requests by 70% (estimated $67/day savings)
2. **Rate Limiting**: 10 RAG queries/user/hour
3. **Batch Processing**: Translate multiple paragraphs in single request
4. **Model Downgrade**: Use GPT-3.5 for low-stakes queries (10x cheaper)
5. **Usage Alerts**: Email when daily cost exceeds $50

---

## Observability & Monitoring

### Metrics to Track

```python
# Agent performance metrics
agent_invocation_count{agent="rag", mode="full-book"}
agent_latency_seconds{agent="rag", quantile="0.95"}
agent_token_usage{agent="personalization", model="gpt-4"}
agent_error_rate{agent="translation", error_type="timeout"}

# Quality metrics
rag_confidence_score{mode="full-book"}
translation_validation_score
personalization_modification_count

# Cost metrics
daily_cost_usd{agent="rag"}
token_usage_total{model="gpt-4"}
```

### Logging Structure
```json
{
  "timestamp": "2025-12-28T10:30:00Z",
  "request_id": "req_abc123",
  "user_id": "user_xyz",
  "agent": "rag",
  "mode": "full-book",
  "query": "What is inverse kinematics?",
  "chunks_retrieved": 5,
  "confidence": 0.89,
  "latency_ms": 1823,
  "tokens": {
    "input": 1945,
    "output": 487,
    "total": 2432
  },
  "cost_usd": 0.058,
  "sources": [
    {"chapter": "02-robotics-fundamentals", "section": "kinematics", "score": 0.92},
    {"chapter": "05-humanoid-robotics", "section": "manipulation", "score": 0.85}
  ]
}
```

---

## Error Handling & Fallbacks

### RAG Agent Failures

| Error | Fallback Strategy |
|-------|------------------|
| Qdrant timeout | Return cached "popular questions" response |
| OpenAI rate limit | Queue request, notify user of delay (ETA: 30s) |
| Low confidence (<0.5) | "I'm not confident about this answer. Try rephrasing your question or consult Chapter X." |
| Empty results | "No relevant information found. Browse the [Table of Contents](/docs) for related topics." |

### Personalization Agent Failures

| Error | Fallback Strategy |
|-------|------------------|
| GPT-4 timeout | Return original content with "Personalization temporarily unavailable" notice |
| User profile missing | Use default profile (intermediate software, hobbyist hardware) |
| Content too long (>8k tokens) | Chunk chapter, personalize sections independently |

### Translation Agent Failures

| Error | Fallback Strategy |
|-------|------------------|
| Claude API error | Return original English content with "Translation service unavailable" |
| Term extraction fails | Translate entire text (accept some terms may be mistranslated) |
| Validation score <70 | Show warning: "Translation quality low. Original content recommended." |

---

## Testing Strategy

### Unit Tests
- Mock OpenAI/Claude API responses
- Test embedding vector generation
- Validate chunk retrieval logic
- Check personalization rule application

### Integration Tests
```python
async def test_rag_full_book_mode():
    # Arrange
    query = "Explain inverse kinematics"
    expected_sources = ["02-robotics-fundamentals/kinematics.md"]

    # Act
    response = await rag_agent.process(query, mode="full-book")

    # Assert
    assert response.confidence > 0.7
    assert len(response.sources) >= 3
    assert any(src.chapter == "02-robotics-fundamentals" for src in response.sources)
    assert response.answer is not None
```

### Load Tests
- Simulate 100 concurrent RAG queries
- Measure p95 latency under load
- Verify rate limiting works correctly
- Monitor token usage and costs

### Quality Tests
```python
async def test_translation_preserves_terms():
    # Arrange
    content = "Inverse kinematics uses Jacobian matrices for real-time control."

    # Act
    translation = await translation_agent.process(content, "urdu")

    # Assert
    assert "Inverse kinematics" in translation.translated  # Term preserved
    assert "Jacobian matrices" in translation.translated   # Term preserved
    assert translation.validation_score > 80
```

---

## Future Enhancements

### Phase 2 Features
1. **Multi-turn conversations**: RAG agent maintains conversation history
2. **Diagram generation**: Generate visual explanations (mermaid diagrams)
3. **Practice problems**: Personalized exercises based on user level
4. **Voice narration**: Text-to-speech for accessibility

### Advanced Agent Capabilities
1. **Self-correction**: Agent validates own answers, regenerates if low confidence
2. **Explanation depth control**: User slider for beginner/intermediate/advanced explanations
3. **Cross-lingual RAG**: Query in Urdu, retrieve from English corpus
4. **Collaborative filtering**: Recommend chapters based on similar users' interactions

---

## Success Criteria

- [ ] RAG agent achieves >85% answer relevance (human evaluation)
- [ ] Personalization agent adds context-appropriate content 90%+ of time
- [ ] Translation agent preserves 100% of technical terms
- [ ] All agents respond within latency budgets (2s for RAG, 5s for personalization, 3s for translation)
- [ ] Daily cost stays under $100 with 1000 active users
- [ ] Zero PII leakage in logs or vector store
- [ ] Agent observability enables 5-minute debugging cycles

---

**Document Status**: ✅ Complete
**Next Steps**: Security & Auth Specification, RAG Flow Specification, Personalization Logic Specification
