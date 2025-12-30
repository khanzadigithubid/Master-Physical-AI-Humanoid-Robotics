# Personalization Logic Specification
**Physical AI & Humanoid Robotics – AI-Native Textbook Platform**

**Date**: 2025-12-28
**Version**: 1.0.0
**Status**: Design

---

## Executive Summary

This document defines the content personalization system that adapts textbook chapters based on learner background (software/hardware experience). Personalization is user-triggered via explicit button click, generates adapted content with GPT-4, and maintains full transparency about modifications made.

---

## Personalization Philosophy

### Core Principles

1. **User Agency**: Personalization MUST be explicitly triggered by user, never automatic
2. **Transparency**: All adaptations clearly marked and explained
3. **Reversibility**: Users can always view original content
4. **Accuracy Preservation**: Technical correctness never compromised for simplification
5. **Context Awareness**: Adaptations consider both user background AND chapter difficulty

### Non-Goals

- **Not a Simplifier**: Personalization adds context, not removes complexity
- **Not a Translator**: Language translation handled separately (Urdu translation agent)
- **Not a Summarizer**: Full content preserved, additional explanations added
- **Not Automatic**: Never runs without user consent

---

## User Background Model

### Software Background Levels

| Level | Description | Typical Learner Profile | Adaptation Strategy |
|-------|-------------|------------------------|---------------------|
| **Beginner** | Little to no programming experience | New to coding, learning Python basics | Add step-by-step code examples, explain syntax, link to programming tutorials |
| **Intermediate** | Comfortable with programming concepts | Can write scripts, understand algorithms | Include pseudocode, reference standard libraries (numpy, scipy), discuss implementation trade-offs |
| **Advanced** | Strong software engineering background | Professional developer, CS degree | Link research papers, discuss complexity analysis, reference advanced frameworks (PyTorch, JAX) |

### Hardware Background Levels

| Level | Description | Typical Learner Profile | Adaptation Strategy |
|-------|-------------|------------------------|---------------------|
| **None** | No hands-on hardware experience | Software-only background, never built robots | Explain sensors in layman terms, avoid hardware jargon, use software analogies |
| **Hobbyist** | Maker/tinkerer experience | Arduino/Raspberry Pi projects, DIY robotics | Reference maker platforms, link to accessible hardware, discuss cost-effective components |
| **Professional** | Industry hardware experience | Electrical engineering background, production systems | Discuss industrial protocols (CAN, Ethernet/IP), real-world constraints (EMI, thermal), link datasheets |

### Background Capture Flow

```
User Signup → Profile Form
  ↓
  "What's your software experience?"
  [Beginner] [Intermediate] [Advanced]

  "What's your hardware experience?"
  [None] [Hobbyist] [Professional]
  ↓
  Store in Neon Postgres (users.software_background, users.hardware_background)
```

---

## Personalization Algorithm

### Input
- `chapter_id`: Which chapter to personalize (e.g., "02-robotics-fundamentals/kinematics.md")
- `user_id`: User requesting personalization
- `user_background`: {software_level, hardware_level} from database

### Process

#### Step 1: Fetch Original Content
```python
async def fetch_chapter_content(chapter_id: str) -> Chapter:
    # Option 1: Fetch from Qdrant metadata (faster)
    result = await qdrant.scroll(
        collection_name="physical-ai-book",
        scroll_filter={
            "must": [{"key": "file_path", "match": {"value": f"*{chapter_id}*"}}]
        },
        limit=100,  # All chunks for this chapter
    )

    chunks = [hit.payload for hit in result.points]

    # Reconstruct chapter from chunks
    content = "\n\n".join([chunk['content'] for chunk in sorted(chunks, key=lambda x: x['chunk_index'])])

    return Chapter(
        id=chapter_id,
        content=content,
        metadata=chunks[0]  # Chapter-level metadata
    )
```

#### Step 2: Generate Adaptation Rules
```python
def get_adaptation_rules(user_background: UserBackground) -> str:
    rules = []

    # Software adaptations
    if user_background.software == "beginner":
        rules.append("- Add Python code examples with line-by-line comments")
        rules.append("- Explain algorithmic concepts in plain language before code")
        rules.append("- Link to beginner Python tutorials (e.g., Real Python, Python.org)")
        rules.append("- Avoid advanced libraries; stick to standard library when possible")

    elif user_background.software == "intermediate":
        rules.append("- Include pseudocode for algorithms")
        rules.append("- Reference numpy, scipy, matplotlib for implementations")
        rules.append("- Discuss time/space complexity trade-offs")
        rules.append("- Suggest refactoring opportunities (functions, classes)")

    elif user_background.software == "advanced":
        rules.append("- Link to research papers for advanced techniques")
        rules.append("- Discuss optimization strategies (vectorization, GPU acceleration)")
        rules.append("- Reference production frameworks (PyTorch, JAX, ROS2)")
        rules.append("- Include performance benchmarks and profiling tips")

    # Hardware adaptations
    if user_background.hardware == "none":
        rules.append("- Explain sensors using software analogies (e.g., 'IMU is like GPS for orientation')")
        rules.append("- Avoid hardware jargon (datasheets, protocols, voltages)")
        rules.append("- Use diagrams and visual explanations for hardware concepts")

    elif user_background.hardware == "hobbyist":
        rules.append("- Reference Arduino, Raspberry Pi, maker platforms")
        rules.append("- Suggest affordable hardware alternatives (e.g., MPU6050 instead of industrial IMU)")
        rules.append("- Link to maker communities (Adafruit, SparkFun)")
        rules.append("- Include DIY project ideas")

    elif user_background.hardware == "professional":
        rules.append("- Discuss industrial communication protocols (CAN, Modbus, EtherCAT)")
        rules.append("- Reference real-world constraints (EMI, thermal management, IP ratings)")
        rules.append("- Link to component datasheets and technical specs")
        rules.append("- Address production considerations (cost, reliability, certifications)")

    return "\n".join(rules)
```

#### Step 3: Construct Personalization Prompt
```python
def build_personalization_prompt(chapter: Chapter, rules: str) -> str:
    prompt = f"""
You are adapting a university-level Physical AI & Humanoid Robotics textbook chapter for a specific learner.

**Original Chapter:**
{chapter.content}

**Learner Background:**
{rules}

**Personalization Instructions:**
1. Preserve ALL technical content and accuracy
2. Add context-appropriate explanations, examples, or references based on learner background
3. Mark all additions with [ADAPTED: reason] tags for transparency
4. Do NOT remove or simplify existing content
5. Maintain markdown formatting (headings, code blocks, equations)
6. Keep the same chapter structure (sections, subsections)

**Output Format:**
Return the adapted chapter in full, with [ADAPTED] tags inline where changes were made.

Example:
```
## Inverse Kinematics

Inverse kinematics (IK) solves for joint angles given a desired end-effector position.

[ADAPTED: Code example for beginner software background]
```python
# Simple 2D IK example for a 2-link arm
import math

def inverse_kinematics_2d(x, y, L1, L2):
    # L1, L2 are link lengths
    # x, y is target position

    # Calculate distance to target
    distance = math.sqrt(x**2 + y**2)

    # Check if target is reachable
    if distance > (L1 + L2):
        return None  # Target out of reach

    # Use law of cosines to find angles
    theta2 = math.acos((x**2 + y**2 - L1**2 - L2**2) / (2 * L1 * L2))
    theta1 = math.atan2(y, x) - math.atan2(L2 * math.sin(theta2), L1 + L2 * math.cos(theta2))

    return theta1, theta2

# Test with simple case
angles = inverse_kinematics_2d(x=3, y=4, L1=2, L2=3)
print(f"Joint angles: {angles}")
```
This example shows how to compute IK for a simple 2-link planar arm using trigonometry.
[/ADAPTED]

The Jacobian matrix approach generalizes this to higher dimensions...
```

**Adapted Chapter:**
"""

    return prompt
```

#### Step 4: Generate Adapted Content
```python
async def generate_adapted_content(prompt: str) -> str:
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": "You are an expert educator adapting technical content for learners with diverse backgrounds. Preserve technical accuracy while adding helpful context."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.4,  # Balance creativity with consistency
        max_tokens=8000,  # Support long chapters
    )

    adapted = response.choices[0].message.content

    # Log token usage
    logger.info(
        "Generated personalized content",
        tokens_used=response.usage.total_tokens,
        cost_usd=calculate_cost("gpt-4", response.usage)
    )

    return adapted
```

#### Step 5: Parse Adaptations
```python
import re

def parse_adaptations(adapted_content: str) -> Tuple[str, List[Adaptation]]:
    """Extract [ADAPTED] tags and create modification summary"""

    adaptations = []
    pattern = r'\[ADAPTED: (.*?)\](.*?)\[/ADAPTED\]'

    matches = re.findall(pattern, adapted_content, re.DOTALL)

    for reason, content in matches:
        adaptations.append(Adaptation(
            reason=reason.strip(),
            content=content.strip()[:200],  # Truncate for summary
            type=classify_adaptation(reason)  # "code_example", "explanation", "reference"
        ))

    # Remove tags for clean display
    clean_content = re.sub(r'\[ADAPTED:.*?\]', '', adapted_content)
    clean_content = re.sub(r'\[/ADAPTED\]', '', clean_content)

    return clean_content, adaptations

def classify_adaptation(reason: str) -> str:
    if "code example" in reason.lower() or "python" in reason.lower():
        return "code_example"
    elif "explanation" in reason.lower() or "clarification" in reason.lower():
        return "explanation"
    elif "link" in reason.lower() or "reference" in reason.lower():
        return "reference"
    else:
        return "other"
```

#### Step 6: Cache Result
```python
async def cache_personalization(user_id: UUID, chapter_id: str, content: str, ttl: int = 1800):
    """Cache for 30 minutes"""
    await redis.setex(
        key=f"personalized:{user_id}:{chapter_id}",
        time=ttl,
        value=content
    )
```

---

## Complete Personalization Flow

```python
class PersonalizationService:
    async def personalize_chapter(self, chapter_id: str, user_id: UUID) -> PersonalizedContent:
        # 1. Check cache
        cached = await redis.get(f"personalized:{user_id}:{chapter_id}")
        if cached:
            logger.info("Personalization cache hit", user_id=user_id, chapter_id=chapter_id)
            return PersonalizedContent.from_cache(cached)

        # 2. Fetch user background
        user = await db.fetch_one("SELECT software_background, hardware_background FROM users WHERE id = $1", user_id)
        background = UserBackground(
            software=user['software_background'],
            hardware=user['hardware_background']
        )

        # 3. Fetch chapter content
        chapter = await fetch_chapter_content(chapter_id)

        # 4. Generate adaptation rules
        rules = get_adaptation_rules(background)

        # 5. Build prompt
        prompt = build_personalization_prompt(chapter, rules)

        # 6. Generate adapted content
        adapted_raw = await generate_adapted_content(prompt)

        # 7. Parse adaptations
        clean_content, adaptations = parse_adaptations(adapted_raw)

        # 8. Cache result
        await cache_personalization(user_id, chapter_id, clean_content)

        # 9. Log personalization event
        await log_personalization(
            user_id=user_id,
            chapter_id=chapter_id,
            background=background,
            adaptations_count=len(adaptations)
        )

        return PersonalizedContent(
            chapter_id=chapter_id,
            content=clean_content,
            adaptations=adaptations,
            background=background,
            original_content=chapter.content,  # For "Show Original" feature
            cached=False
        )
```

---

## Frontend Integration

### Personalize Button
```typescript
// src/components/PersonalizeButton.tsx
import { useState } from 'react'

export function PersonalizeButton({ chapterId }: { chapterId: string }) {
  const [loading, setLoading] = useState(false)
  const [personalized, setPersonalized] = useState<PersonalizedContent | null>(null)

  async function handlePersonalize() {
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/personalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // Send auth cookie
        body: JSON.stringify({ chapter_id: chapterId }),
      })

      if (!response.ok) throw new Error('Personalization failed')

      const data = await response.json()
      setPersonalized(data)

      // Replace chapter content with personalized version
      document.getElementById('chapter-content').innerHTML = data.content
    } catch (error) {
      console.error(error)
      alert('Personalization failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handlePersonalize}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? 'Personalizing...' : '✨ Personalize for Me'}
      </button>

      {personalized && (
        <div className="text-sm text-gray-600">
          {personalized.adaptations.length} adaptations applied
          <button onClick={() => window.location.reload()} className="ml-2 underline">
            Show Original
          </button>
        </div>
      )}
    </div>
  )
}
```

### Adaptation Summary Modal
```typescript
// src/components/AdaptationSummary.tsx
export function AdaptationSummary({ adaptations }: { adaptations: Adaptation[] }) {
  const counts = {
    code_example: adaptations.filter(a => a.type === 'code_example').length,
    explanation: adaptations.filter(a => a.type === 'explanation').length,
    reference: adaptations.filter(a => a.type === 'reference').length,
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 my-4">
      <h3 className="font-bold text-blue-900">Personalization Applied</h3>
      <ul className="mt-2 space-y-1 text-sm text-blue-800">
        {counts.code_example > 0 && <li>✅ {counts.code_example} code examples added</li>}
        {counts.explanation > 0 && <li>✅ {counts.explanation} explanations added</li>}
        {counts.reference > 0 && <li>✅ {counts.reference} references added</li>}
      </ul>

      <details className="mt-4">
        <summary className="cursor-pointer text-blue-700 underline">View all changes</summary>
        <ul className="mt-2 space-y-2">
          {adaptations.map((a, i) => (
            <li key={i} className="text-xs text-gray-700 border-l-2 border-blue-300 pl-2">
              <strong>{a.type}:</strong> {a.reason}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
```

---

## API Endpoint

```python
# src/api/personalization.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/personalize")

class PersonalizeRequest(BaseModel):
    chapter_id: str

@router.post("")
async def personalize(
    req: PersonalizeRequest,
    user: User = Depends(get_current_user),
    service: PersonalizationService = Depends(get_personalization_service)
) -> PersonalizedContent:
    try:
        result = await service.personalize_chapter(req.chapter_id, user.id)
        return result
    except ChapterNotFoundError:
        raise HTTPException(status_code=404, detail="Chapter not found")
    except PersonalizationError as e:
        logger.error("Personalization failed", error=str(e), user_id=user.id, chapter_id=req.chapter_id)
        raise HTTPException(status_code=500, detail="Personalization failed")
```

---

## Example Adaptations

### Beginner Software + None Hardware

**Original Text:**
```markdown
## Inverse Kinematics

Inverse kinematics (IK) computes joint configurations that achieve a desired end-effector pose. The Jacobian-based approach linearizes the relationship between joint velocities and end-effector velocities.
```

**Adapted Text:**
```markdown
## Inverse Kinematics

Inverse kinematics (IK) computes joint configurations that achieve a desired end-effector pose.

[ADAPTED: Explanation for beginner software background]
**What does this mean?** Imagine a robot arm trying to reach a cup. Inverse kinematics is the math that figures out how much to bend each joint (shoulder, elbow, wrist) so the hand lands exactly on the cup. It's "inverse" because we know where we want to go (the cup) and work backwards to find the joint angles.
[/ADAPTED]

The Jacobian-based approach linearizes the relationship between joint velocities and end-effector velocities.

[ADAPTED: Code example for beginner software background]
```python
# Simple 2D inverse kinematics example
import math

def inverse_kinematics_2link(target_x, target_y, link1_length, link2_length):
    """
    Calculate joint angles for a 2-link arm to reach (target_x, target_y).

    Args:
        target_x: Desired x position
        target_y: Desired y position
        link1_length: Length of first link
        link2_length: Length of second link

    Returns:
        (angle1, angle2) in radians, or None if unreachable
    """
    # Calculate distance from origin to target
    distance = math.sqrt(target_x**2 + target_y**2)

    # Check if target is within reach
    if distance > (link1_length + link2_length):
        print("Target is too far away!")
        return None

    # Use trigonometry (law of cosines) to find angles
    # ... (implementation details)
    return angle1, angle2

# Try it out
angles = inverse_kinematics_2link(3.0, 4.0, 2.0, 3.0)
print(f"Joint angles: {angles}")
```
This example shows a simple case with just two links. Real robots have many more joints, making the math more complex!
[/ADAPTED]
```

### Advanced Software + Professional Hardware

**Original Text:**
```markdown
## Sensor Fusion

Sensor fusion combines data from multiple sensors (IMU, cameras, LiDAR) to estimate robot state. Kalman filters are commonly used for probabilistic state estimation.
```

**Adapted Text:**
```markdown
## Sensor Fusion

Sensor fusion combines data from multiple sensors (IMU, cameras, LiDAR) to estimate robot state. Kalman filters are commonly used for probabilistic state estimation.

[ADAPTED: Reference for advanced software background]
For production-grade implementations, consider:
- **Extended Kalman Filter (EKF)**: See [Probabilistic Robotics](http://www.probabilistic-robotics.org/) by Thrun et al., Chapter 3
- **Unscented Kalman Filter (UKF)**: Better handling of nonlinear dynamics, [Wan & van der Merwe, 2000](https://ieeexplore.ieee.org/document/882463)
- **Particle Filters**: Higher computational cost but no linearity assumptions, implemented in [mrpt](https://www.mrpt.org/)

Libraries:
- [robot_localization](http://docs.ros.org/en/melodic/api/robot_localization/html/index.html) (ROS): Production EKF/UKF for mobile robots
- [GTSAM](https://gtsam.org/): Factor graph optimization for SLAM
[/ADAPTED]

[ADAPTED: Hardware considerations for professional background]
**Production Sensor Fusion Challenges:**
- **Timestamp synchronization**: IMU at 200Hz, cameras at 30Hz, LiDAR at 10Hz → requires hardware timestamping (IEEE 1588 PTP)
- **Sensor calibration**: Extrinsic calibration between sensors critical for accuracy (see [Kalibr](https://github.com/ethz-asl/kalibr))
- **IMU bias drift**: Temperature-dependent, requires online estimation (MEMS IMUs drift ~0.1°/s)
- **Communication latency**: CAN bus introduces 1-5ms latency, Ethernet/IP <1ms but requires deterministic networking

Recommended IMUs for production:
- **VectorNav VN-100**: Tactical-grade, <0.05° RMS heading accuracy, [$1,495 datasheet](https://www.vectornav.com/resources/datasheets/vn-100-datasheet)
- **Xsens MTi-series**: Industrial, IP67, -40°C to +85°C operating range
[/ADAPTED]
```

---

## Cost Management

### Token Usage Estimates

| Chapter Length | Tokens (Input) | Tokens (Output) | Cost/Personalization |
|---------------|----------------|-----------------|---------------------|
| Short (2k tokens) | 2500 | 3000 | $0.125 |
| Medium (4k tokens) | 5000 | 6000 | $0.25 |
| Long (8k tokens) | 9000 | 10000 | $0.475 |

**Assumptions**: GPT-4 pricing ($0.01/1k input, $0.03/1k output)

### Cost Control
1. **Caching**: 30-minute TTL reduces re-personalization (saves ~70% with typical browsing patterns)
2. **Rate limiting**: 5 personalizations/hour per user
3. **Batch processing**: Pre-generate personalizations for popular chapters during off-peak hours
4. **Model downgrade**: Use GPT-3.5-turbo for simple chapters (10x cheaper, acceptable quality for introductory content)

**Daily Budget**: 200 personalizations/day × $0.25 avg = $50/day

---

## Quality Assurance

### Automated Checks
```python
async def validate_adaptation(original: str, adapted: str) -> ValidationResult:
    issues = []

    # 1. Check length (adapted should be longer, not shorter)
    if len(adapted) < len(original) * 0.95:
        issues.append("Adapted content is shorter than original (potential content loss)")

    # 2. Check technical term preservation
    technical_terms = extract_technical_terms(original)
    for term in technical_terms:
        if term not in adapted:
            issues.append(f"Technical term missing: {term}")

    # 3. Check equation preservation
    equations_original = re.findall(r'\$.*?\$', original)
    equations_adapted = re.findall(r'\$.*?\$', adapted)
    if len(equations_adapted) < len(equations_original):
        issues.append("Some equations missing in adapted content")

    # 4. Check markdown structure
    headings_original = re.findall(r'^#{1,6}\s', original, re.MULTILINE)
    headings_adapted = re.findall(r'^#{1,6}\s', adapted, re.MULTILINE)
    if len(headings_adapted) < len(headings_original):
        issues.append("Heading structure altered")

    return ValidationResult(
        passed=len(issues) == 0,
        issues=issues,
        score=1.0 - (len(issues) * 0.2)  # Penalize each issue
    )
```

### Human Review
- Sample 10% of personalizations weekly
- Reviewers rate accuracy (1-5), relevance (1-5), transparency (1-5)
- Threshold: Average scores must be >4.0

---

## Success Criteria

- [ ] Personalization completes in < 5 seconds (p95 latency)
- [ ] 95%+ of adapted content preserves technical accuracy (human review)
- [ ] All adaptations clearly marked with [ADAPTED] tags
- [ ] "Show Original" button functional 100% of time
- [ ] Cache hit rate > 60% for personalized chapters
- [ ] Cost per personalization < $0.30
- [ ] User satisfaction > 4.0/5 (post-personalization survey)
- [ ] Zero complaints about missing technical content
- [ ] Adaptation summary modal displays correctly on all devices

---

**Document Status**: ✅ Complete
**All Step 1 Specifications Complete**
