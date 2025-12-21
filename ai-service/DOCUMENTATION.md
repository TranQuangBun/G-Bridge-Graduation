# AI Matching Service - Tài liệu chi tiết

> Tài liệu đầy đủ về AI Matching Service, bao gồm cơ chế hoạt động, tối ưu hóa, cơ sở lý thuyết, và hướng dẫn cấu hình.

---

## Mục lục

1. [Environment Variables](#environment-variables)
2. [Mechanism - Cơ chế hoạt động](#mechanism---cơ-chế-hoạt-động)
3. [OpenAI Optimization](#openai-optimization)
4. [Theoretical Foundation](#theoretical-foundation)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Environment Variables

### Required Variables

#### OPENAI_API_KEY

| Property | Value |
|----------|-------|
| **Type** | String (secret) |
| **Format** | `sk-...` (OpenAI API key format) |
| **Required** | Yes |
| **Default** | - |

**Ví dụ:**

```bash
OPENAI_API_KEY=sk-proj-abc123xyz789...
```

**Cách lấy:**

1. Đăng ký tài khoản tại https://platform.openai.com/
2. Tạo API key trong API Keys section
3. Copy key (chỉ hiển thị một lần, lưu cẩn thận)

> **Security:**
> - **KHÔNG BAO GIỜ** commit vào git
> - **KHÔNG BAO GIỜ** share publicly
> - Sử dụng `.env` file (đã có trong `.gitignore`)
> - Sử dụng secrets management trong production

**Validation:**
- Service sẽ fail nếu không có key này
- Key phải valid và có credits/quota

### Optional Variables

#### OPENAI_MODEL

| Property | Value |
|----------|-------|
| **Type** | String |
| **Default** | `gpt-4-turbo-preview` |
| **Required** | No |

**Giá trị hợp lệ:**

| Model | Description |
|-------|-------------|
| `gpt-4-turbo-preview` | Recommended - best quality |
| `gpt-4-0125-preview` | Latest GPT-4 |
| `gpt-3.5-turbo` | Cost-effective alternative |

> **Note:** Model names có thể thay đổi theo thời gian. Check OpenAI documentation cho latest models.

#### API_PORT

| Property | Value |
|----------|-------|
| **Type** | Integer |
| **Default** | `5000` |
| **Required** | No |

> **Note:** Phải match với port trong `docker-compose.yml`. Đảm bảo port không bị conflict với services khác.

#### API_HOST

| Property | Value |
|----------|-------|
| **Type** | String |
| **Default** | `0.0.0.0` |
| **Required** | No |

| Value | Description |
|-------|-------------|
| `0.0.0.0` | Listen trên tất cả interfaces (recommended cho Docker) |
| `127.0.0.1` | Chỉ listen trên localhost |

#### LOG_LEVEL

| Property | Value |
|----------|-------|
| **Type** | String |
| **Default** | `INFO` |
| **Required** | No |

| Level | Description | Use Case |
|-------|-------------|----------|
| `DEBUG` | Chi tiết nhất, include debug info | Development |
| `INFO` | Thông tin chung (recommended) | Development/Production |
| `WARNING` | Chỉ warnings và errors | Production |
| `ERROR` | Chỉ errors | Production |
| `CRITICAL` | Chỉ critical errors | Production |

#### ALLOWED_ORIGINS

| Property | Value |
|----------|-------|
| **Type** | String (comma-separated list) |
| **Default** | `http://localhost:4000,http://localhost:3333` |
| **Required** | No |

**Ví dụ:**

```bash
# Single origin
ALLOWED_ORIGINS=http://localhost:4000

# Multiple origins
ALLOWED_ORIGINS=http://localhost:4000,http://localhost:3333,https://app.example.com
```

> **Note:**
> - Phải match với frontend URLs
> - Include protocol (`http://` hoặc `https://`)
> - No trailing slashes
> - Comma-separated, no spaces

**Production Example:**

```bash
ALLOWED_ORIGINS=https://gbridge.com,https://www.gbridge.com
```

### Configuration Files

#### .env File

**Location:** `/ai-service/.env`

**Format:**

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-abc123xyz789...
OPENAI_MODEL=gpt-4-turbo-preview

# Service Configuration
API_PORT=5000
API_HOST=0.0.0.0
LOG_LEVEL=INFO

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:4000,http://localhost:3333
```

> **Note:**
> - File này đã có trong `.gitignore`
> - Không commit vào git
> - Copy từ `.env.example` và điền values

#### Docker Environment Variables

Thêm vào `docker-compose.yml`:

```yaml
ai-service:
  environment:
    - OPENAI_API_KEY=${OPENAI_API_KEY:-your_openai_api_key_here}
    - OPENAI_MODEL=${OPENAI_MODEL:-gpt-4-turbo-preview}
    - API_PORT=5000
    - API_HOST=0.0.0.0
    - LOG_LEVEL=INFO
    - ALLOWED_ORIGINS=http://localhost:4000,http://localhost:3333
```

### Environment Variables Summary

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4-turbo-preview` | Model to use |
| `API_PORT` | No | `5000` | Service port |
| `API_HOST` | No | `0.0.0.0` | Host address |
| `LOG_LEVEL` | No | `INFO` | Logging level |
| `ALLOWED_ORIGINS` | No | `http://localhost:4000,http://localhost:3333` | CORS origins |

---

## Mechanism - Cơ chế hoạt động

### Kiến Trúc Tổng Thể

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

### Luồng Xử Lý Request

#### 1. Nhận Request từ Backend

**Endpoint:** `POST /api/v1/match/job`

**Input:**
- Job data (title, description, requirements, etc.)
- List of interpreter profiles
- Configuration (max_results, min_score, etc.)

**Validation:**
- Pydantic models tự động validate input data
- Đảm bảo type safety và data integrity

#### 2. Xử Lý trong Matching Service

```python
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

#### 3. Tương Tác với OpenAI

##### Xây Dựng Prompt

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

##### Structured Output với JSON Schema

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
                    "category": {"type": "string"},
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "explanation": {"type": "string"}
                }
            }
        },
        "strengths": {"type": "array", "items": {"type": "string"}},
        "weaknesses": {"type": "array", "items": {"type": "string"}}
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
- Đảm bảo format nhất quán
- Type safety (số, chuỗi, mảng)
- Validation tự động
- Dễ parse và xử lý

#### 4. Xử Lý Response

##### Parse JSON Response

```python
result = json.loads(response.choices[0].message.content)
```

##### Tính Score Level

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

##### Ranking và Filtering

```python
# Sort by score
matches.sort(
    key=lambda x: x.suitability_score.overall_score,
    reverse=True  # Highest score first
)

# Assign priority
for idx, match in enumerate(matches, start=1):
    match.match_priority = idx

# Filter by minimum score
filtered = [
    match for match in matches
    if match.suitability_score.overall_score >= min_score
]

# Limit results
filtered = filtered[:max_results]
```

### Các Tính Năng Chính

#### 1. Job-Interpreter Matching

**Mục đích:** Tìm các interpreters phù hợp nhất cho một job.

**Quy trình:**
1. Nhận job data và list interpreters
2. Score từng interpreter với job
3. Sort theo score (descending)
4. Trả về top N results

#### 2. Suitability Scoring

**Mục đích:** Đánh giá chi tiết mức độ phù hợp của một interpreter với một job.

**Quy trình:**
1. Nhận job và interpreter data
2. Build detailed prompt
3. Call OpenAI với structured output
4. Parse và format response

#### 3. Application Filtering

**Mục đích:** Lọc và xếp hạng các job applications dựa trên AI scoring.

**Quy trình:**
1. Nhận job và list applications
2. Extract interpreter profile từ mỗi application
3. Score từng application
4. Filter theo min_score
5. Sort và rank
6. Trả về top results

---

## OpenAI Optimization

### Model Selection

#### GPT-4 Turbo (Recommended)

| Property | Value |
|----------|-------|
| **Model** | `gpt-4-turbo-preview` hoặc `gpt-4-0125-preview` |
| **Use for** | Complex matching, detailed analysis, high-stakes decisions |

**Pros:**
- Best accuracy và reasoning
- Better instruction following
- Supports structured output
- Better at complex multi-step reasoning

**Cons:**
- Higher cost (~10x GPT-3.5)
- Slower response time (~2-3s)
- Higher token usage

#### GPT-3.5 Turbo

| Property | Value |
|----------|-------|
| **Model** | `gpt-3.5-turbo` |
| **Use for** | Simple matching, high-volume scenarios, cost-sensitive applications |

**Pros:**
- Lower cost (10x cheaper)
- Faster response (~1s)
- Still good quality cho simple cases

**Cons:**
- Less accurate cho complex cases
- May miss nuances
- Weaker reasoning capabilities

#### Decision Matrix

| Scenario | Recommended Model | Reason |
|----------|------------------|--------|
| High-stakes matching | GPT-4 Turbo | Best accuracy |
| High volume, simple cases | GPT-3.5 Turbo | Cost-effective |
| Complex multi-factor analysis | GPT-4 Turbo | Better reasoning |
| Real-time matching | GPT-3.5 Turbo | Faster response |

---

## Advanced Configuration - Tối Ưu Theo Nhu Cầu

### 1. Temperature - Control Randomness

#### 1.1. Hiểu Temperature

**Temperature** control randomness của LLM output:
- **Low (0.0-0.3)**: Deterministic, consistent, focused
- **Medium (0.4-0.7)**: Balanced, some variation
- **High (0.8-1.0)**: Creative, varied, unpredictable

**Cách hoạt động:**
```
Temperature = 0.0: Model luôn chọn token có probability cao nhất
Temperature = 0.3: Model chọn từ top tokens với slight randomness
Temperature = 1.0: Model chọn tokens theo probability distribution
```

#### 1.2. Current Setting: `temperature=0.3`

**Code implementation:**
```python
response = self.client.chat.completions.create(
    model=self.model,
    messages=[...],
    temperature=0.3,  # Lower temperature for consistency
    ...
)
```

**Why 0.3 for Matching?**

1. **Consistency**: Cùng input → gần như cùng output
2. **Fairness**: Đảm bảo fair evaluation cho tất cả candidates
3. **Reliability**: Scores không vary quá nhiều giữa các lần gọi
4. **Reproducibility**: Có thể reproduce results để debug/verify

**Trade-offs:**
- Consistent scores (variance < 2-3 points)
- Reliable rankings (order stable)
- Fair evaluation (không bias random)
- Ít creative solutions (có thể miss edge cases)
- Có thể miss alternative interpretations

#### 1.3. Tối Ưu Temperature Cho Các Use Cases

**Strict Matching (Current - Recommended):**
```python
temperature=0.3
```
- Use case: Standard job-interpreter matching
- Goal: Consistent, fair, reliable scores
- Variance: < 3 points

**More Flexible Matching:**
```python
temperature=0.5
```
- Use case: Khi muốn consider alternative interpretations
- Goal: Slightly more variation, still consistent
- Variance: 3-5 points

**Highly Consistent (Strict):**
```python
temperature=0.1
```
- Use case: Critical decisions, legal compliance
- Goal: Maximum consistency, minimal variation
- Variance: < 1 point
- Warning: Có thể quá rigid, miss nuances

**Creative Exploration:**
```python
temperature=0.7
```
- Use case: Research, exploring new matching strategies
- Goal: More diverse perspectives
- Variance: 5-10 points
- Warning: Không recommended cho production matching

**Configuration Example:**
```python
# In config.py or environment
TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE", "0.3"))

# In openai_service.py
response = self.client.chat.completions.create(
    ...
    temperature=settings.temperature,  # Use from config
    ...
)
```

### 2. Top-p (Nucleus Sampling) - Control Diversity

#### 2.1. Hiểu Top-p

**Top-p** control diversity bằng cách chỉ consider tokens với cumulative probability ≤ p.

**Cách hoạt động:**
```
Top-p = 0.1: Chỉ consider top 10% tokens (very focused)
Top-p = 0.9: Consider top 90% tokens (balanced)
Top-p = 1.0: Consider all tokens (default, maximum diversity)
```

**Ví dụ:**
```
Token probabilities: [0.4, 0.3, 0.2, 0.05, 0.03, 0.02]
Cumulative: [0.4, 0.7, 0.9, 0.95, 0.98, 1.0]

Top-p = 0.9: Chỉ consider tokens 1, 2, 3 (cumulative = 0.9)
Top-p = 1.0: Consider all tokens
```

#### 2.2. Current Setting: Default (1.0)

**Code implementation:**
```python
# Currently not set, uses default 1.0
response = self.client.chat.completions.create(
    ...
    # top_p not specified = 1.0 (default)
)
```

#### 2.3. Tối Ưu Top-p

**Recommended for Matching:**
```python
top_p=0.9
```

**Lý do:**
- Temperature=0.3 đã control randomness
- Top-p=0.9 giúp focus hơn một chút
- Balance giữa consistency và quality
- Tránh quá nhiều low-probability tokens

**Configuration:**
```python
response = self.client.chat.completions.create(
    ...
    temperature=0.3,
    top_p=0.9,  # Slightly more focused
    ...
)
```

**Use Cases:**

| Top-p | Use Case | Effect |
|-------|----------|--------|
| 0.5 | Very strict matching | Maximum focus, minimal variation |
| 0.9 | Standard matching (recommended) | Balanced, slight focus |
| 1.0 | Default | Maximum diversity (current) |

### 3. Frequency và Presence Penalties

#### 3.1. Frequency Penalty

**Frequency Penalty** reduce repetition của tokens đã xuất hiện.

**Range:** -2.0 to 2.0 (default: 0)

**Cách hoạt động:**
```
frequency_penalty > 0: Penalize tokens đã xuất hiện
frequency_penalty = 0: No penalty (default)
frequency_penalty < 0: Encourage repetition (rarely used)
```

**Ví dụ:**
```
Response có nhiều "excellent" → frequency_penalty=0.1 giúp đa dạng hơn
```

#### 3.2. Presence Penalty

**Presence Penalty** encourage new topics/concepts.

**Range:** -2.0 to 2.0 (default: 0)

**Cách hoạt động:**
```
presence_penalty > 0: Encourage new topics
presence_penalty = 0: No penalty (default)
```

#### 3.3. Tối Ưu Cho Matching

**Recommended Configuration:**
```python
frequency_penalty=0.1  # Slight penalty để tránh repetition
presence_penalty=0.0   # Không cần (structured output)
```

**Lý do:**
- Structured output đã có format cố định
- Frequency penalty giúp đa dạng explanations
- Presence penalty không cần vì output structure đã định

**Configuration:**
```python
response = self.client.chat.completions.create(
    ...
    frequency_penalty=0.1,  # Reduce repetition
    presence_penalty=0.0,   # Not needed
    ...
)
```

**When to Adjust:**

| Scenario | Frequency Penalty | Reason |
|----------|------------------|--------|
| Responses có nhiều repetition | 0.2-0.3 | Increase để đa dạng hơn |
| Standard matching | 0.1 | Slight penalty |
| Need exact repetition | 0.0 | No penalty |

### 4. Max Tokens - Control Response Length

#### 4.1. Hiểu Max Tokens

**Max Tokens** limit số tokens trong response.

**Default:** Model-dependent (GPT-4: 4096, GPT-3.5: 4096)

**Cách hoạt động:**
```
max_tokens=100: Response tối đa 100 tokens
max_tokens=1000: Response tối đa 1000 tokens
max_tokens=None: Use model default (4096)
```

#### 4.2. Current Setting: Not Set (Uses Default)

**Code implementation:**
```python
# Currently not set
response = self.client.chat.completions.create(
    ...
    # max_tokens not specified = model default
)
```

#### 4.3. Tối Ưu Max Tokens

**Recommended:**
```python
max_tokens=1000
```

**Lý do:**
- Our response structure: ~300-500 tokens
- 1000 tokens = safe margin (2x expected)
- Prevent truncation
- Control costs (tokens = cost)

**Estimation:**
```
overall_score: ~10 tokens
reasons (5 items): ~200-300 tokens
strengths (3 items): ~50-100 tokens
weaknesses (2 items): ~30-50 tokens
Total: ~300-500 tokens
```

**Configuration:**
```python
response = self.client.chat.completions.create(
    ...
    max_tokens=1000,  # Safe margin
    ...
)
```

**Cost Impact:**
```
Without max_tokens: Model có thể generate up to 4096 tokens
With max_tokens=1000: Limit to 1000 tokens max
Cost savings: ~75% potential savings (if model would generate more)
```

### 5. Advanced Configuration Profiles

#### 5.1. High Quality Profile (Current - Recommended)

| Property | Value |
|----------|-------|
| **Use Case** | Production matching, high-stakes decisions |
| **Model** | `gpt-4-turbo-preview` |
| **Temperature** | `0.3` |
| **Max Tokens** | `1000` |
| **Top-p** | `0.9` |
| **Frequency Penalty** | `0.1` |

```python
{
    "model": "gpt-4-turbo-preview",
    "temperature": 0.3,
    "max_tokens": 1000,
    "top_p": 0.9,
    "frequency_penalty": 0.1,
    "presence_penalty": 0.0,
    "response_format": {"type": "json_object"}
}
```

**Characteristics:**
- Best accuracy
- Consistent scores
- Reliable rankings
- Higher cost (~$0.02-0.03 per match)
- Slower (~2-3s per match)

#### 5.2. Cost Optimized Profile

| Property | Value |
|----------|-------|
| **Use Case** | High volume, cost-sensitive scenarios |
| **Model** | `gpt-3.5-turbo` |
| **Temperature** | `0.3` |
| **Max Tokens** | `500` |

```python
{
    "model": "gpt-3.5-turbo",
    "temperature": 0.3,
    "max_tokens": 500,
    "top_p": 0.9,
    "frequency_penalty": 0.1,
    "presence_penalty": 0.0,
    "response_format": {"type": "json_object"}
}
```

**Characteristics:**
- Lower cost (~$0.002-0.003 per match, 10x cheaper)
- Faster (~1s per match)
- Slightly less accurate
- May miss nuances

#### 5.3. Fast Processing Profile

| Property | Value |
|----------|-------|
| **Use Case** | Real-time matching, low latency requirements |
| **Model** | `gpt-3.5-turbo` |
| **Temperature** | `0.2` |
| **Max Tokens** | `500` |

```python
{
    "model": "gpt-3.5-turbo",
    "temperature": 0.2,
    "max_tokens": 500,
    "top_p": 0.8,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0,
    "response_format": {"type": "json_object"}
}
```

**Characteristics:**
- Fastest (~0.8-1s per match)
- Very consistent (temperature=0.2)
- Less detailed explanations
- May miss edge cases

#### 5.4. Maximum Consistency Profile

| Property | Value |
|----------|-------|
| **Use Case** | Legal compliance, audit requirements |
| **Model** | `gpt-4-turbo-preview` |
| **Temperature** | `0.1` |
| **Max Tokens** | `1000` |

```python
{
    "model": "gpt-4-turbo-preview",
    "temperature": 0.1,
    "max_tokens": 1000,
    "top_p": 0.5,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0,
    "response_format": {"type": "json_object"}
}
```

**Characteristics:**
- Maximum consistency (variance < 1 point)
- Reproducible results
- May be too rigid
- Higher cost

### 6. Dynamic Configuration Based on Use Case

#### 6.1. Implementation Strategy

**Option 1: Environment Variables**
```python
# In .env
OPENAI_TEMPERATURE=0.3
OPENAI_TOP_P=0.9
OPENAI_MAX_TOKENS=1000
OPENAI_FREQUENCY_PENALTY=0.1

# In config.py
class Settings(BaseSettings):
    openai_temperature: float = 0.3
    openai_top_p: float = 0.9
    openai_max_tokens: int = 1000
    openai_frequency_penalty: float = 0.1
```

**Option 2: Request-Level Configuration**
```python
# Allow override per request
async def score_suitability(
    self, 
    job: JobInput, 
    interpreter: InterpreterProfileInput,
    config: Optional[OpenAIConfig] = None
) -> SuitabilityScore:
    temperature = config.temperature if config else settings.temperature
    # ... use in API call
```

**Option 3: Profile-Based**
```python
PROFILES = {
    "high_quality": {
        "model": "gpt-4-turbo-preview",
        "temperature": 0.3,
        ...
    },
    "cost_optimized": {
        "model": "gpt-3.5-turbo",
        "temperature": 0.3,
        ...
    }
}

# Use profile
config = PROFILES.get(profile_name, PROFILES["high_quality"])
```

### 7. Cost Optimization Strategies

#### 7.1. Token Usage Analysis

**Current Token Usage per Request:**

| Component | Tokens |
|-----------|--------|
| System message | ~50 tokens |
| User prompt | ~500-800 tokens |
| **Input total** | **~550-850 tokens** |
| **Output** | **~300-500 tokens** |
| **Total** | **~850-1350 tokens per request** |

**Cost per Request:**

| Model | Input Cost | Output Cost | Total Cost |
|-------|------------|-------------|------------|
| **GPT-4 Turbo** | $0.0055-0.0085 | $0.009-0.015 | **~$0.0145-0.0235 per match** |
| **GPT-3.5 Turbo** | $0.0003-0.0004 | $0.0005-0.0008 | **~$0.0008-0.0012 per match** (10x cheaper!) |

#### 7.2. Optimization Techniques

**1. Prompt Optimization:**
```python
# Before: Verbose
prompt = f"""Please analyze the suitability of an interpreter for a job position 
and provide a detailed suitability score. The job requirements are as follows: 
{job.title} which requires {job.descriptions}..."""

# After: Concise but complete
prompt = f"""Analyze interpreter suitability for job.

JOB: {job.title}
Description: {job.descriptions}
Languages: {', '.join([f"{lang.language} ({lang.level})" for lang in job.required_languages])}
..."""
```
**Savings:** ~20-30% tokens

**2. Model Selection:**
- Use GPT-3.5 cho simple cases
- Use GPT-4 cho complex cases
- **Savings:** ~90% cost cho simple cases

**3. Max Tokens Limit:**
```python
max_tokens=1000  # Instead of default 4096
```
**Savings:** Prevent over-generation, control costs

**4. Caching (Future):**
```python
# Cache results cho same job-interpreter pairs
cache_key = f"{job.id}_{interpreter.id}"
if cache_key in cache:
    return cache[cache_key]
```
**Savings:** 100% cost cho cached requests

**5. Batch Processing (Future):**
```python
# Score multiple interpreters in one API call
# Use OpenAI batch API
```
**Savings:** ~30-50% cost (reduced overhead)

### 8. Performance Tuning

#### 8.1. Response Time Optimization

**Factors affecting response time:**
1. Model choice (GPT-4 slower than GPT-3.5)
2. Prompt length (longer = slower)
3. Max tokens (higher = potentially slower)
4. Network latency

**Optimization:**
```python
# Use GPT-3.5 for speed
model = "gpt-3.5-turbo"

# Reduce prompt length
prompt = concise_prompt  # Remove redundant text

# Set reasonable max_tokens
max_tokens = 500  # Instead of 1000
```

#### 8.2. Parallel Processing

**Current: Sequential**
```python
for interpreter in interpreters:
    score = await score_suitability(job, interpreter)  # Sequential
```

**Optimized: Parallel**
```python
import asyncio

scores = await asyncio.gather(*[
    score_suitability(job, interpreter)
    for interpreter in interpreters
])  # Parallel
```

**Speed improvement:** ~Nx faster (N = number of interpreters)

### 9. Configuration Best Practices

#### 9.1. Start với Defaults

```python
# Start với recommended configuration
{
    "model": "gpt-4-turbo-preview",
    "temperature": 0.3,
    "max_tokens": 1000,
    "top_p": 0.9,
    "frequency_penalty": 0.1,
    "response_format": {"type": "json_object"}
}
```

#### 9.2. Monitor và Measure

- Track response times
- Monitor costs
- Measure score consistency
- Collect user feedback

#### 9.3. Iterate Based on Data

- If scores too variable → Lower temperature
- If cost too high → Consider GPT-3.5
- If responses too short → Increase max_tokens
- If too slow → Optimize prompt or use GPT-3.5

#### 9.4. A/B Testing

Test different configurations:
```python
# Test A: temperature=0.3
# Test B: temperature=0.5
# Compare: Accuracy, consistency, user satisfaction
```

### 10. Complete Configuration Reference

**All Available Parameters:**

```python
response = client.chat.completions.create(
    # Model
    model="gpt-4-turbo-preview",  # or "gpt-3.5-turbo"
    
    # Messages
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ],
    
    # Output Format
    response_format={"type": "json_object"},  # Force JSON
    
    # Sampling Parameters
    temperature=0.3,        # 0.0-2.0, default: 1.0
    top_p=0.9,             # 0.0-1.0, default: 1.0
    frequency_penalty=0.1, # -2.0 to 2.0, default: 0
    presence_penalty=0.0,   # -2.0 to 2.0, default: 0
    
    # Response Control
    max_tokens=1000,        # 1-4096, default: model max
    
    # Optional
    n=1,                    # Number of completions (default: 1)
    stop=None,              # Stop sequences
    stream=False,           # Stream response
    timeout=60,             # Request timeout
)
```

**Recommended Values for Matching:**

| Parameter | Recommended | Range | Notes |
|-----------|------------|-------|-------|
| `model` | `gpt-4-turbo-preview` | - | Best quality |
| `temperature` | `0.3` | 0.0-2.0 | Consistency |
| `top_p` | `0.9` | 0.0-1.0 | Slight focus |
| `frequency_penalty` | `0.1` | -2.0-2.0 | Reduce repetition |
| `presence_penalty` | `0.0` | -2.0-2.0 | Not needed |
| `max_tokens` | `1000` | 1-4096 | Safe margin |
| `response_format` | `{"type": "json_object"}` | - | Required |

---

## Theoretical Foundation

### 1. Large Language Models (LLMs) và GPT-4

#### 1.1. Kiến Trúc LLM

**Large Language Models (LLMs)** là các mô hình deep learning được train trên lượng dữ liệu văn bản khổng lồ để hiểu và generate ngôn ngữ tự nhiên. GPT-4 là một trong những LLM mạnh nhất hiện tại.

**Transformer Architecture:**

```
Input Text → Tokenization → Embedding → Transformer Blocks → Output
                                    ↓
                            [Attention Mechanism]
                            - Self-Attention: Hiểu context trong input
                            - Multi-Head Attention: Nhiều perspectives
                            - Feed-Forward Networks: Xử lý thông tin
```

**Các thành phần chính:**

1. **Tokenization**: Chia text thành tokens (từ, subwords)
2. **Embedding**: Chuyển tokens thành vectors số học
3. **Attention Mechanism**: Tập trung vào các phần quan trọng của input
4. **Transformer Blocks**: Xử lý và transform thông tin qua nhiều layers
5. **Output Generation**: Tạo text dựa trên context đã học

#### 1.2. Đặc điểm của GPT-4

**Pre-training:**
- Được train trên hàng tỷ tokens từ internet (text, code, documents)
- Học patterns, grammar, facts, và reasoning từ dữ liệu
- Không cần fine-tuning cho nhiều tasks (zero-shot learning)

**Few-shot Learning:**
- Có thể học từ vài ví dụ (1-5 examples) mà không cần fine-tuning
- Hiểu pattern từ examples và áp dụng cho cases mới

**In-context Learning:**
- Hiểu và làm theo instructions trong prompt
- Có thể thay đổi behavior chỉ bằng cách thay đổi prompt
- Không cần retrain model

**Reasoning Capabilities:**
- Chain-of-thought reasoning: Suy nghĩ từng bước
- Multi-step problem solving
- Context understanding: Hiểu ngữ cảnh dài

#### 1.3. Ứng dụng trong Matching

**1. Semantic Understanding:**
```
Traditional: "Medical" == "Medical" (exact match)
LLM-based: "Medical" ≈ "Healthcare" ≈ "Clinical" ≈ "Hospital" (semantic similarity)
```

**2. Multi-dimensional Analysis:**
- Phân tích nhiều yếu tố cùng lúc (languages, experience, certifications, rates)
- Balance và weight các factors dựa trên context
- Hiểu implicit requirements (ví dụ: "senior" → cần nhiều experience)

**3. Explainable Scoring:**
- Không chỉ cho score mà còn giải thích tại sao
- Break down score thành categories
- Provide actionable feedback

### 2. Prompt Engineering - Nghệ Thuật và Khoa Học

#### 2.1. Định Nghĩa và Tầm Quan Trọng

**Prompt Engineering** là nghệ thuật và khoa học thiết kế prompts (đầu vào) để LLM tạo ra output mong muốn với độ chính xác cao.

**Tại sao quan trọng?**
- Cùng một model, prompt khác nhau → kết quả khác nhau hoàn toàn
- Prompt tốt → accuracy cao, consistent, reliable
- Prompt kém → inaccurate, inconsistent, unreliable

#### 2.2. Các Kỹ Thuật Prompt Engineering

##### 2.2.1. System Message (Role Definition)

**Mục đích:** Định nghĩa role và persona của AI, set context và expectations.

**Ví dụ trong code:**
```python
system_message = """You are an expert HR and recruitment AI assistant 
specializing in matching interpreters with job opportunities. 
Analyze job requirements and interpreter profiles to provide 
accurate suitability scores."""
```

**Best Practices:**
- Be specific: "expert HR assistant" thay vì "AI assistant"
- Set domain: "specializing in matching interpreters"
- Define task: "provide accurate suitability scores"
- Avoid: Generic roles như "You are helpful"

**Tại sao hiệu quả?**
- LLM được train trên nhiều text về HR/recruitment
- System message activate relevant knowledge trong model
- Guide model behavior và reasoning style

##### 2.2.2. Structured Instructions (Task Decomposition)

**Mục đích:** Break down complex task thành sub-tasks rõ ràng.

**Ví dụ trong code:**
```python
prompt = f"""
EVALUATION CRITERIA:
1. Language Match: How well do languages match?
2. Specialization Match: How well do specializations align?
3. Experience Level: Is experience appropriate?
4. Certification Match: Does interpreter have required certs?
5. Rate Compatibility: Is rate within acceptable range?
6. Overall Fit: Consider all factors together.
"""
```

**Best Practices:**
- Numbered list: Dễ follow và check
- Clear questions: "How well do X match?" thay vì "Check X"
- Logical order: Từ specific → general
- Complete coverage: Không bỏ sót criteria quan trọng

**Tại sao hiệu quả?**
- Model suy nghĩ từng bước thay vì một lúc
- Đảm bảo tất cả criteria được evaluate
- Dễ debug và improve

##### 2.2.3. Chain-of-Thought Reasoning

**Mục đích:** Hướng dẫn model suy nghĩ từng bước, không jump to conclusion.

**Ví dụ:**
```
Instead of:
"Score this match: 85"

Use:
"First, evaluate language match: Perfect (100)
 Then, evaluate specialization: Good (80)
 Then, evaluate experience: Fair (70)
 Finally, combine: Overall 85"
```

**Implementation trong prompt:**
```python
prompt += """
ANALYSIS PROCESS:
1. First, evaluate each criterion individually
2. Then, consider how criteria interact
3. Finally, synthesize into overall score
4. Provide detailed explanation for each step
"""
```

**Benefits:**
- More accurate: Model không rush to conclusion
- Explainable: User hiểu reasoning process
- Debuggable: Có thể check từng step

##### 2.2.4. Output Format Specification

**Mục đích:** Ensure consistent output format, dễ parse programmatically.

**Ví dụ trong code:**
```python
prompt += """
Provide a JSON response with:
- overall_score: A number from 0-100
- reasons: Array of objects with:
  * category: string (e.g., 'language', 'specialization')
  * score: number (0-100)
  * explanation: string
- strengths: Array of strings (at least 2-3 items)
- weaknesses: Array of strings (at least 1-2 items)
"""
```

**Best Practices:**
- Explicit format: "JSON response with..."
- Type specification: "number from 0-100"
- Structure details: Nested objects, arrays
- Constraints: "at least 2-3 items"
- Examples: Show expected format

**Tại sao hiệu quả?**
- Model hiểu rõ output format mong muốn
- Giảm parsing errors
- Consistent structure across requests

##### 2.2.5. Context-Rich Prompts

**Mục đích:** Cung cấp đầy đủ context để model hiểu rõ task.

**Ví dụ trong code:**
```python
prompt = f"""
JOB REQUIREMENTS:
- Title: {job.title}
- Description: {job.descriptions}
- Required Languages: {', '.join([f"{lang.language} ({lang.level})" for lang in job.required_languages])}
- Required Domains: {', '.join([d.domain for d in job.domains])}
- Salary Range: ${job.min_salary} - ${job.max_salary}

INTERPRETER PROFILE:
- Languages: {', '.join([f"{lang.language} ({lang.level})" for lang in interpreter.languages])}
- Specializations: {', '.join([spec.specialization for spec in interpreter.specializations])}
- Experience: {interpreter.experience_years} years
- Hourly Rate: ${interpreter.hourly_rate}
"""
```

**Best Practices:**
- Structured data: Use clear sections (JOB REQUIREMENTS, INTERPRETER PROFILE)
- Complete information: Include all relevant fields
- Format clearly: Use bullets, labels
- Handle missing data: "N/A" thay vì empty

**Tại sao hiệu quả?**
- Model có đủ context để make informed decision
- Không phải guess missing information
- Consistent evaluation across different inputs

#### 2.3. Prompt Template trong Code

**Actual implementation:**
```python
def _build_suitability_prompt(self, job: JobInput, interpreter: InterpreterProfileInput) -> str:
    prompt = f"""Analyze the suitability of an interpreter for a job position and provide a detailed suitability score.

JOB REQUIREMENTS:
- Title: {job.title}
- Description: {job.descriptions or 'N/A'}
- Required Languages: {', '.join([f"{lang.language} ({lang.level})" for lang in job.required_languages])}
- Required Domains: {', '.join([d.domain for d in job.domains])}

INTERPRETER PROFILE:
- Languages: {', '.join([f"{lang.language} ({lang.level})" for lang in interpreter.languages])}
- Specializations: {', '.join([spec.specialization for spec in interpreter.specializations])}
- Experience: {interpreter.experience_years} years

EVALUATION CRITERIA:
1. Language Match: How well do languages match?
2. Specialization Match: How well do specializations align?
...

Provide a JSON response with:
- overall_score: A number from 0-100
- reasons: Array of objects...
"""
    return prompt
```

**Analysis:**
- Clear structure: Sections rõ ràng
- Complete data: Tất cả fields quan trọng
- Evaluation criteria: Explicit instructions
- Output format: JSON specification

### 3. Structured Output - Đảm Bảo Format Nhất Quán

#### 3.1. Vấn Đề với LLM Output

**Traditional LLM Output:**
- Free-form text: Không có structure cố định
- Inconsistent format: Mỗi lần có thể khác nhau
- Hard to parse: Phải dùng regex, NLP parsing
- Missing fields: Có thể thiếu thông tin quan trọng
- Invalid values: Scores có thể ngoài range

**Ví dụ vấn đề:**
```
Response 1: "The score is 85. This is a good match because..."
Response 2: "Score: 85/100. Good match. Reasons: ..."
Response 3: "Overall suitability: 85. The candidate..."
```

→ Không thể parse programmatically một cách reliable!

#### 3.2. Giải Pháp: Structured Output với JSON Schema

**Structured Output** sử dụng JSON Schema để constrain output của LLM, đảm bảo format nhất quán.

**Implementation trong code:**
```python
response = self.client.chat.completions.create(
    model=self.model,
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ],
    response_format={"type": "json_object"},  # Force JSON output
    temperature=0.3
)
```

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
                    "category": {"type": "string"},
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "explanation": {"type": "string"}
                },
                "required": ["category", "score", "explanation"]
            }
        },
        "strengths": {"type": "array", "items": {"type": "string"}},
        "weaknesses": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["overall_score", "reasons", "strengths", "weaknesses"]
}
```

#### 3.3. Cách Hoạt Động

**1. Schema Definition:**
- Define structure trong code (hoặc prompt)
- Specify types, constraints, required fields

**2. Prompt Instruction:**
- Tell model về JSON format trong prompt
- Provide example structure

**3. API Configuration:**
- `response_format={"type": "json_object"}` force JSON output
- Model phải generate valid JSON

**4. Validation:**
- Parse JSON response
- Validate với Pydantic models
- Handle errors gracefully

**Actual parsing code:**
```python
# Parse response
result = json.loads(response.choices[0].message.content)

# Validate với Pydantic
reasons = [
    MatchReason(
        category=r["category"],
        score=r["score"],
        explanation=r["explanation"]
    )
    for r in result.get("reasons", [])
]

overall_score = float(result.get("overall_score", 0))
```

#### 3.4. Lợi Ích của Structured Output

**1. Guaranteed Format:**
- Output luôn là valid JSON
- Structure nhất quán giữa các requests
- Không cần complex parsing

**2. Type Safety:**
- Numbers là numbers (không phải strings)
- Arrays là arrays
- Objects có đúng structure

**3. Validation:**
- Required fields luôn có
- Values trong range (0-100)
- Types đúng (string, number, array)

**4. Integration:**
- Dễ dàng integrate với backend
- Direct mapping to Pydantic models
- Type-safe processing

#### 3.5. Best Practices

**1. Explicit Schema trong Prompt:**
```
Provide a JSON response with:
- overall_score: number (0-100)
- reasons: array of objects with category, score, explanation
```

**2. Combine với API Config:**
```python
response_format={"type": "json_object"}  # Force JSON
```

**3. Validate Response:**
```python
try:
    result = json.loads(response.content)
    # Validate với Pydantic
    score = SuitabilityScore(**result)
except ValidationError:
    # Handle invalid response
```

**4. Error Handling:**
```python
try:
    result = json.loads(response.content)
except json.JSONDecodeError:
    # Retry or use fallback
```

### 4. Kết Hợp: Prompting + LLM + Structured Output

**Flow hoàn chỉnh:**

```
1. System Message (Role Definition)
   ↓
2. Structured Prompt (Context + Instructions)
   ↓
3. LLM Processing (GPT-4 với attention mechanism)
   ↓
4. Structured Output (JSON với schema)
   ↓
5. Validation & Parsing (Pydantic models)
   ↓
6. Business Logic (Scoring, Ranking)
```

**Tại sao combination này mạnh?**

1. **Prompting** → Guide model behavior, ensure accuracy
2. **LLM** → Semantic understanding, reasoning, context
3. **Structured Output** → Reliable format, type safety, integration

**Kết quả:**
- Accurate: Model hiểu task rõ ràng
- Consistent: Format nhất quán
- Reliable: Có thể parse và validate
- Explainable: Có reasoning và explanations

### Semantic Similarity và Matching

**Keyword Matching vs Semantic Matching:**

**Keyword Matching (Traditional):**
- "Medical" chỉ match với "Medical"
- Không hiểu synonyms ("Healthcare" ≠ "Medical")
- Không hiểu context

**Semantic Matching (LLM-based):**
- "Medical" match với "Healthcare", "Clinical", "Hospital"
- Hiểu context và nuances
- Có thể match implicit requirements

**Multi-dimensional Matching:**
1. **Language Match**: Exact + proficiency levels
2. **Domain Match**: Specializations và contexts
3. **Experience Match**: Years và quality
4. **Certification Match**: Required vs available
5. **Rate Match**: Budget compatibility
6. **Soft Factors**: Portfolio, ratings, completed jobs

### Explainable AI (XAI)

**Tầm Quan Trọng:**
- Legal compliance (không được discriminate)
- User trust (hiểu tại sao AI recommend)
- Improvement (biết cần làm gì để match tốt hơn)

**Cách Triển Khai:**
1. **Reasons**: Detailed explanation cho mỗi category
2. **Strengths**: List những điểm mạnh
3. **Weaknesses**: List những điểm yếu
4. **Recommendation**: Text summary

### Evaluation Metrics và Scoring

**Score Range (0-100):**
- Intuitive và dễ hiểu
- Standard trong HR/recruitment
- Dễ visualize và communicate

**Score Levels:**

| Level | Range | Description |
|-------|-------|-------------|
| **Excellent** | 90-100 | Perfect match, highly recommended |
| **Good** | 70-89 | Strong match, minor gaps |
| **Fair** | 50-69 | Acceptable match, some gaps |
| **Poor** | 0-49 | Poor match, significant gaps |

**Category Scores:**

Mỗi category (Language, Specialization, etc.) cũng được score 0-100 để:

| Benefit | Description |
|---------|-------------|
| **Transparency** | User biết tại sao overall score như vậy |
| **Actionability** | Biết cần improve gì |
| **Explainability** | AI decisions có thể giải thích được |

---

## Best Practices

### Security

| Practice | Description |
|---------|-------------|
| **API Key Management** | Store trong environment variables, never commit to git, use secrets management trong production |
| **Input Validation** | Pydantic models validate all inputs, prevent injection attacks |
| **Network Security** | Use HTTPS trong production, restrict CORS origins, use firewall rules |

### Performance

| Practice | Description |
|---------|-------------|
| **Async Processing** | Sử dụng `async/await` cho non-blocking I/O, handle multiple requests concurrently |
| **Caching** (Future) | Cache results cho cùng job-interpreter pair, reduce API calls và cost |
| **Batching** (Future) | Score multiple interpreters trong một API call, sử dụng OpenAI batch API |

### Error Handling

| Type | Handling |
|------|----------|
| **OpenAI API Errors** | Implement retry logic với exponential backoff, handle rate limiting gracefully |
| **Validation Errors** | Pydantic tự động validate input, trả về 400 Bad Request nếu invalid |
| **Timeout Handling** | Backend có timeout 60s cho AI requests, trả về error nếu timeout |

### Monitoring

| Metric | Method |
|--------|--------|
| **Health Check** | `GET /api/v1/health` |
| **Processing Time** | Track time cho mỗi request, return trong response |
| **Error Tracking** | Log errors với context, alert on failures |

---

## Troubleshooting

### Common Issues

#### Issue 1: Service không start

**Error:**
```
Error: OPENAI_API_KEY is required
```

**Solution:**
- Set `OPENAI_API_KEY` trong `.env` file
- Kiểm tra file `.env` có tồn tại không
- Kiểm tra format của API key (phải bắt đầu với `sk-`)

#### Issue 2: API calls fail

**Error:**
```
Error: Invalid API key
```

**Solution:**

| Check | Action |
|-------|--------|
| API key có đúng không | Verify key format và copy lại |
| API key có credits/quota không | Check tại https://platform.openai.com/usage |
| API key có bị revoke không | Tạo key mới nếu cần |

#### Issue 3: CORS errors

**Error:**
```
Error: CORS policy blocked
```

**Solution:**

| Check | Action |
|-------|--------|
| `ALLOWED_ORIGINS` có match với frontend URL không | Verify trong `.env` |
| Include protocol (`http://` hoặc `https://`) | Đảm bảo có protocol |
| No trailing slashes | Remove trailing slashes nếu có |
| Comma-separated, no spaces | Format: `http://localhost:4000,http://localhost:3333` |

#### Issue 4: Port already in use

**Error:**
```
Error: Address already in use
```

**Solution:**

| Method | Command |
|--------|---------|
| Change port | Change `API_PORT` trong `.env` |
| Stop service | `lsof -ti:5000 | xargs kill -9` (Linux/Mac) |

### Debug Mode

**Enable debug logging:**

```bash
LOG_LEVEL=DEBUG
```

**Check environment variables:**

```python
import os
print(os.getenv("OPENAI_API_KEY"))  # Should not print in production!
print(os.getenv("OPENAI_MODEL"))
```

> **Warning:** Không print API key trong production logs!

---

## Future Enhancements

1. **Vector Embeddings**: Sử dụng embeddings để similarity search
2. **Fine-tuning**: Fine-tune model cho domain-specific matching
3. **Multi-model Support**: Support multiple LLM providers
4. **Batch Processing**: Process multiple matches in parallel
5. **Real-time Updates**: WebSocket support cho real-time matching
6. **A/B Testing**: Test different prompt strategies
7. **Feedback Loop**: Learn from user feedback để improve matching

---

## Kết Luận

AI Matching Service kết hợp:
- **LLM Power**: GPT-4's understanding và reasoning
- **Prompt Engineering**: Guide model behavior
- **Structured Output**: Ensure reliability
- **Semantic Matching**: Beyond keyword matching
- **Explainability**: Transparent decisions
- **Scalability**: Async, caching, batching

Hệ thống này tận dụng sức mạnh của LLMs để tạo ra intelligent, explainable, và scalable matching solution.

