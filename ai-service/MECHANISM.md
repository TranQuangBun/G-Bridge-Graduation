# Cơ Chế Hoạt Động của AI Matching Service

## Tổng Quan

AI Matching Service là một microservice được xây dựng bằng Python FastAPI, sử dụng OpenAI GPT-4 để thực hiện việc đánh giá và khớp giữa job posts và interpreter profiles. Service này áp dụng các kỹ thuật **Prompt Engineering** và **Structured Output** để đảm bảo kết quả chính xác và nhất quán.

## Kiến Trúc Tổng Thể

```
┌─────────────┐
│   Client    │ (Backend Node.js)
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────────────────────┐
│   AI Matching Service           │
│   (Python FastAPI)              │
├─────────────────────────────────┤
│ 1. API Routes                   │
│ 2. Matching Service             │
│ 3. OpenAI Service               │
└──────┬──────────────────────────┘
       │ API Call
       ▼
┌─────────────┐
│   OpenAI    │ (GPT-4)
│   API       │
└─────────────┘
```

## Luồng Xử Lý Request

### 1. Nhận Request từ Backend

**Endpoint:** `POST /api/v1/match/job`

**Input:**
- Job data (title, description, requirements, etc.)
- List of interpreter profiles
- Configuration (max_results, min_score, etc.)

**Validation:**
- Pydantic models tự động validate input data
- Đảm bảo type safety và data integrity

### 2. Xử Lý trong Matching Service

```python
# matching_service.py
async def match_job_to_interpreters(request):
    # 1. Validate input
    # 2. Loop through each interpreter
    for interpreter in request.interpreters:
        # 3. Call OpenAI service for each interpreter
        suitability_score = await openai_service.score_suitability(
            job, interpreter
        )
        # 4. Store results
        matches.append(JobInterpreterMatch(...))
    
    # 5. Sort by score (descending)
    matches.sort(key=lambda x: x.suitability_score.overall_score)
    
    # 6. Assign priority rankings
    # 7. Limit results
    # 8. Return response
```

### 3. Tương Tác với OpenAI

#### 3.1. Xây Dựng Prompt

**Mục đích:** Tạo prompt chi tiết để LLM hiểu rõ yêu cầu và ngữ cảnh.

**Cấu trúc Prompt:**

```
1. System Message:
   - Định nghĩa vai trò của AI (HR/Recruitment expert)
   - Hướng dẫn cách phân tích

2. User Message (Job Requirements):
   - Title, Description, Responsibilities
   - Location, Working Mode
   - Salary Range
   - Required Languages (với proficiency levels)
   - Required Domains/Specializations
   - Required Certifications

3. User Message (Interpreter Profile):
   - Languages (với levels)
   - Specializations
   - Experience (years)
   - Hourly Rate
   - Certifications
   - Portfolio/Background
   - Rating & Completed Jobs

4. Evaluation Criteria:
   - Language Match
   - Specialization Match
   - Experience Level
   - Certification Match
   - Rate Compatibility
   - Overall Fit
```

**Ví dụ Prompt:**

```
Analyze the suitability of an interpreter for a job position...

JOB REQUIREMENTS:
- Title: Medical Interpreter
- Description: Provide interpretation services for medical consultations
- Required Languages: English (Native), Vietnamese (Fluent)
- Required Domains: Medical
- Salary Range: $50-70/hour

INTERPRETER PROFILE:
- Languages: English (Native), Vietnamese (Fluent), French (Intermediate)
- Specializations: Medical (5 years), Legal (2 years)
- Experience: 7 years
- Hourly Rate: $60 USD
- Certifications: Medical Interpreter Certification
- Rating: 4.8/5.0
- Completed Jobs: 150

EVALUATION CRITERIA:
1. Language Match: How well do languages match?
2. Specialization Match: How well do specializations align?
...
```

#### 3.2. Structured Output với JSON Schema

**Mục đích:** Đảm bảo LLM trả về đúng format mong muốn.

**JSON Schema Definition:**

```python
response_schema = {
    "type": "object",
    "properties": {
        "overall_score": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "description": "Overall suitability score from 0 to 100"
        },
        "reasons": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Category of match"
                    },
                    "score": {
                        "type": "number",
                        "minimum": 0,
                        "maximum": 100
                    },
                    "explanation": {
                        "type": "string",
                        "description": "Detailed explanation"
                    }
                }
            }
        },
        "strengths": {
            "type": "array",
            "items": {"type": "string"}
        },
        "weaknesses": {
            "type": "array",
            "items": {"type": "string"}
        }
    },
    "required": ["overall_score", "reasons", "strengths", "weaknesses"]
}
```

**OpenAI API Call:**

```python
response = client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ],
    response_format={"type": "json_object"},  # Force JSON output
    temperature=0.3  # Lower temperature for consistency
)
```

**Lợi ích của Structured Output:**
- ✅ Đảm bảo format nhất quán
- ✅ Type safety (số, chuỗi, mảng)
- ✅ Validation tự động
- ✅ Dễ parse và xử lý

### 4. Xử Lý Response

#### 4.1. Parse JSON Response

```python
result = json.loads(response.choices[0].message.content)
# {
#   "overall_score": 95.0,
#   "reasons": [...],
#   "strengths": [...],
#   "weaknesses": [...]
# }
```

#### 4.2. Tính Score Level

```python
def _calculate_score_level(score: float) -> MatchScoreLevel:
    if score >= 90:
        return MatchScoreLevel.EXCELLENT
    elif score >= 70:
        return MatchScoreLevel.GOOD
    elif score >= 50:
        return MatchScoreLevel.FAIR
    else:
        return MatchScoreLevel.POOR
```

#### 4.3. Tạo Recommendation Text

```python
def _get_recommendation(score: float) -> str:
    if score >= 90:
        return "Highly recommended - Excellent match..."
    elif score >= 70:
        return "Good match - Strong candidate..."
    # ...
```

#### 4.4. Build SuitabilityScore Object

```python
suitability_score = SuitabilityScore(
    overall_score=overall_score,
    score_level=score_level,
    reasons=[MatchReason(...) for r in result["reasons"]],
    strengths=result["strengths"],
    weaknesses=result["weaknesses"],
    recommendation=recommendation
)
```

### 5. Ranking và Filtering

#### 5.1. Sort by Score

```python
matches.sort(
    key=lambda x: x.suitability_score.overall_score,
    reverse=True  # Highest score first
)
```

#### 5.2. Assign Priority

```python
for idx, match in enumerate(matches, start=1):
    match.match_priority = idx
```

#### 5.3. Apply Filters

```python
# Filter by minimum score
filtered = [
    match for match in matches
    if match.suitability_score.overall_score >= min_score
]

# Limit results
filtered = filtered[:max_results]
```

### 6. Trả Về Response

**Response Format:**

```json
{
  "job_id": 1,
  "total_interpreters": 10,
  "matched_interpreters": [
    {
      "interpreter_id": 5,
      "suitability_score": {
        "overall_score": 95.0,
        "score_level": "excellent",
        "reasons": [
          {
            "category": "language",
            "score": 100.0,
            "explanation": "Perfect language match..."
          },
          {
            "category": "specialization",
            "score": 95.0,
            "explanation": "Strong specialization alignment..."
          }
        ],
        "strengths": [
          "Native proficiency in required languages",
          "Extensive medical interpretation experience"
        ],
        "weaknesses": [
          "Rate slightly above job range"
        ],
        "recommendation": "Highly recommended - Excellent match..."
      },
      "match_priority": 1
    }
  ],
  "processing_time_ms": 1234.56
}
```

## Các Tính Năng Chính

### 1. Job-Interpreter Matching

**Mục đích:** Tìm các interpreters phù hợp nhất cho một job.

**Quy trình:**
1. Nhận job data và list interpreters
2. Score từng interpreter với job
3. Sort theo score (descending)
4. Trả về top N results

**Use Case:**
- Organization tìm interpreters cho job mới
- Suggest interpreters khi tạo job

### 2. Suitability Scoring

**Mục đích:** Đánh giá chi tiết mức độ phù hợp của một interpreter với một job.

**Quy trình:**
1. Nhận job và interpreter data
2. Build detailed prompt
3. Call OpenAI với structured output
4. Parse và format response

**Use Case:**
- Xem chi tiết tại sao một interpreter phù hợp
- So sánh giữa các interpreters

### 3. Application Filtering

**Mục đích:** Lọc và xếp hạng các job applications dựa trên AI scoring.

**Quy trình:**
1. Nhận job và list applications
2. Extract interpreter profile từ mỗi application
3. Score từng application
4. Filter theo min_score
5. Sort và rank
6. Trả về top results

**Use Case:**
- Organization xem applications đã được AI rank
- Tự động shortlist candidates

## Prompt Engineering Strategies

### 1. Context-Rich Prompts

- Cung cấp đầy đủ thông tin về job và interpreter
- Bao gồm cả implicit requirements (experience, rating, etc.)

### 2. Structured Evaluation Criteria

- Rõ ràng các tiêu chí đánh giá
- Weighted scoring cho từng category

### 3. Explicit Instructions

- Hướng dẫn LLM cách tính score
- Yêu cầu giải thích chi tiết

### 4. Temperature Control

- `temperature=0.3` để đảm bảo consistency
- Tránh variation quá lớn giữa các lần gọi

## Error Handling

### 1. OpenAI API Errors

```python
try:
    response = client.chat.completions.create(...)
except Exception as e:
    raise OpenAIException(f"Error scoring suitability: {str(e)}")
```

### 2. Validation Errors

- Pydantic tự động validate input
- Trả về 400 Bad Request nếu invalid

### 3. Timeout Handling

- Backend có timeout 60s cho AI requests
- Trả về error nếu timeout

## Performance Optimization

### 1. Async Processing

- Sử dụng `async/await` cho non-blocking I/O
- Có thể parallelize multiple scoring calls (future enhancement)

### 2. Caching (Future Enhancement)

- Cache results cho cùng job-interpreter pair
- Reduce API calls và cost

### 3. Batch Processing (Future Enhancement)

- Score multiple interpreters trong một API call
- Sử dụng OpenAI batch API

## Security & Best Practices

### 1. API Key Management

- Store trong environment variables
- Never commit to git

### 2. Input Validation

- Pydantic models validate all inputs
- Prevent injection attacks

### 3. Rate Limiting (Future Enhancement)

- Limit requests per client
- Prevent abuse

### 4. Logging

- Log all requests và responses
- Monitor for errors

## Monitoring & Observability

### 1. Health Check

```
GET /api/v1/health
```

### 2. Processing Time

- Track time cho mỗi request
- Return trong response

### 3. Error Tracking

- Log errors với context
- Alert on failures

## Cost Optimization

### 1. Model Selection

- Sử dụng `gpt-4-turbo-preview` (cheaper than gpt-4)
- Có thể downgrade to `gpt-3.5-turbo` cho simple cases

### 2. Prompt Optimization

- Keep prompts concise nhưng đầy đủ
- Remove unnecessary context

### 3. Caching

- Cache results để tránh duplicate calls
- TTL-based cache invalidation

## Future Enhancements

1. **Vector Embeddings**: Sử dụng embeddings để similarity search
2. **Fine-tuning**: Fine-tune model cho domain-specific matching
3. **Multi-model Support**: Support multiple LLM providers
4. **Batch Processing**: Process multiple matches in parallel
5. **Real-time Updates**: WebSocket support cho real-time matching
6. **A/B Testing**: Test different prompt strategies
7. **Feedback Loop**: Learn from user feedback để improve matching

## Kết Luận

AI Matching Service sử dụng kết hợp:
- **Prompt Engineering** để tạo prompts chi tiết và có cấu trúc
- **Structured Output** để đảm bảo format nhất quán
- **Type Safety** với Pydantic để validate data
- **Async Processing** để optimize performance

Service này cung cấp intelligent matching capabilities cho platform, giúp organizations tìm interpreters phù hợp và interpreters tìm jobs phù hợp một cách hiệu quả hơn.

