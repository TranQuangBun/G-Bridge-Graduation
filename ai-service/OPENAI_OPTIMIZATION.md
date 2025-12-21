# Tối Ưu Hóa Cấu Hình OpenAI

## Tổng Quan

Tài liệu này hướng dẫn cách tận dụng các configuration options của OpenAI API để đạt được kết quả tốt nhất cho AI Matching Service.

## 1. Model Selection

### 1.1. Available Models

**GPT-4 Turbo (Recommended):**
- Model: `gpt-4-turbo-preview` hoặc `gpt-4-0125-preview`
- **Pros:**
  - Best accuracy và reasoning
  - Better instruction following
  - Supports structured output
- **Cons:**
  - Higher cost
  - Slower response time
- **Use for:** Complex matching, detailed analysis

**GPT-3.5 Turbo:**
- Model: `gpt-3.5-turbo`
- **Pros:**
  - Lower cost (10x cheaper)
  - Faster response
  - Still good quality
- **Cons:**
  - Less accurate cho complex cases
  - May miss nuances
- **Use for:** Simple matching, high-volume scenarios

### 1.2. Model Selection Strategy

```python
# Current implementation
model = "gpt-4-turbo-preview"  # Best quality

# Alternative for cost optimization
if simple_case:
    model = "gpt-3.5-turbo"
else:
    model = "gpt-4-turbo-preview"
```

**Recommendation:**
- Start with GPT-4 Turbo để đảm bảo quality
- Monitor costs và performance
- Consider GPT-3.5 cho simple cases nếu cần

## 2. Temperature Configuration

### 2.1. Current Setting

```python
temperature=0.3
```

### 2.2. Temperature Ranges và Use Cases

| Temperature | Use Case | Characteristics |
|------------|----------|----------------|
| 0.0-0.2 | Deterministic tasks | Very consistent, little variation |
| 0.3-0.5 | Structured output | Consistent với slight variation |
| 0.6-0.8 | Creative tasks | More varied, creative |
| 0.9-1.0 | Highly creative | Maximum randomness |

### 2.3. Why 0.3 for Matching?

**Reasons:**
1. **Consistency**: Cùng input → gần như cùng output
2. **Fairness**: Đảm bảo fair evaluation
3. **Reliability**: Scores không vary quá nhiều
4. **Reproducibility**: Có thể reproduce results

**Trade-offs:**
- ✅ Consistent scores
- ✅ Reliable rankings
- ❌ Ít creative solutions
- ❌ Có thể miss edge cases

### 2.4. Optimization Tips

**For Different Scenarios:**

```python
# Strict matching (current)
temperature = 0.3

# More flexible matching (if needed)
temperature = 0.5

# Highly consistent (if scores vary too much)
temperature = 0.1
```

**Recommendation:** Giữ ở 0.3 cho matching tasks.

## 3. Structured Output (JSON Mode)

### 3.1. Current Implementation

```python
response_format={"type": "json_object"}
```

### 3.2. Benefits

1. **Guaranteed JSON**: Output luôn là valid JSON
2. **Type Safety**: Đúng format mong muốn
3. **Parsing**: Dễ dàng parse programmatically
4. **Consistency**: Format nhất quán

### 3.3. Best Practices

**1. Explicit Schema in Prompt:**

```
Provide a JSON response with:
- overall_score: number (0-100)
- reasons: array of objects
  - category: string
  - score: number (0-100)
  - explanation: string
```

**2. Combine với JSON Schema (Future):**

OpenAI có thể support JSON Schema trong tương lai:
```python
response_format={
    "type": "json_schema",
    "json_schema": {
        "name": "suitability_score",
        "schema": {...}
    }
}
```

**3. Validate Output:**

```python
# Parse và validate
result = json.loads(response.choices[0].message.content)
# Validate với Pydantic
suitability_score = SuitabilityScore(**result)
```

## 4. Max Tokens Configuration

### 4.1. Current Setting

Không set `max_tokens` (sử dụng default)

### 4.2. Token Limits

| Model | Max Tokens (Output) |
|-------|---------------------|
| GPT-4 Turbo | 4,096 tokens |
| GPT-3.5 Turbo | 4,096 tokens |

### 4.3. Optimization

**For Structured Output:**

```python
# Estimate tokens needed
# Our response: ~500-800 tokens
max_tokens = 1000  # Safe margin
```

**Benefits:**
- Prevent truncation
- Ensure complete responses
- Control costs (tokens = cost)

**Recommendation:**
- Set `max_tokens=1000` để đảm bảo complete response
- Monitor actual usage và adjust

## 5. Top-p (Nucleus Sampling)

### 5.1. Current Setting

Không set (sử dụng default = 1.0)

### 5.2. Understanding Top-p

**Top-p** control diversity bằng cách chỉ consider tokens với cumulative probability ≤ p.

**Values:**
- `0.1`: Very focused (top 10% tokens)
- `0.5`: Balanced
- `1.0`: All tokens (default)

### 5.3. For Matching Tasks

**Recommendation:** Giữ default (1.0) hoặc set `top_p=0.9`:

```python
top_p=0.9  # Slightly more focused
```

**Why:**
- Temperature=0.3 đã control randomness
- Top-p=0.9 giúp focus hơn một chút
- Balance giữa consistency và quality

## 6. Frequency và Presence Penalties

### 6.1. Current Setting

Không set (sử dụng default = 0)

### 6.2. Understanding Penalties

**Frequency Penalty:**
- Reduce repetition của tokens đã xuất hiện
- Range: -2.0 to 2.0
- Default: 0

**Presence Penalty:**
- Encourage new topics/concepts
- Range: -2.0 to 2.0
- Default: 0

### 6.3. For Matching Tasks

**Recommendation:** Có thể thử:

```python
frequency_penalty=0.1  # Slight penalty để tránh repetition
presence_penalty=0.0   # Không cần (structured output)
```

**Use Case:**
- Nếu responses có quá nhiều repetition
- Nếu muốn more diverse explanations

## 7. System Message Optimization

### 7.1. Current System Message

```python
"You are an expert HR and recruitment AI assistant specializing in matching interpreters with job opportunities. Analyze job requirements and interpreter profiles to provide accurate suitability scores."
```

### 7.2. Best Practices

**1. Be Specific:**
- ✅ "expert HR and recruitment AI assistant"
- ✅ "specializing in matching interpreters"
- ❌ "You are an AI assistant" (too generic)

**2. Set Expectations:**
- ✅ "provide accurate suitability scores"
- ✅ "Analyze job requirements and interpreter profiles"

**3. Add Constraints (if needed):**
```
- Be objective and fair
- Consider all factors equally
- Provide detailed explanations
```

### 7.3. Optimization Tips

**Version 1 (Current):**
```
"You are an expert HR and recruitment AI assistant..."
```

**Version 2 (More Detailed):**
```
"You are an expert HR and recruitment AI assistant specializing in matching interpreters with job opportunities. Your task is to:
1. Analyze job requirements comprehensively
2. Evaluate interpreter profiles objectively
3. Provide accurate suitability scores (0-100)
4. Explain your reasoning clearly
Be fair, objective, and consider all relevant factors."
```

**Version 3 (With Constraints):**
```
"You are an expert HR and recruitment AI assistant. When matching:
- Focus on job requirements, not personal characteristics
- Be objective and avoid bias
- Provide detailed, actionable feedback
- Score accurately based on qualifications"
```

**Recommendation:** Thử Version 2 nếu cần more detailed analysis.

## 8. Prompt Structure Optimization

### 8.1. Current Structure

```
1. System Message
2. User Message với:
   - Job Requirements (structured)
   - Interpreter Profile (structured)
   - Evaluation Criteria (explicit)
   - Output Format (detailed)
```

### 8.2. Prompt Engineering Best Practices

**1. Clear Sections:**

```
JOB REQUIREMENTS:
- Title: ...
- Description: ...
...

INTERPRETER PROFILE:
- Languages: ...
- Specializations: ...
...

EVALUATION CRITERIA:
1. Language Match: ...
2. Specialization Match: ...
...
```

**2. Explicit Instructions:**

```
Provide a JSON response with:
- overall_score: A number from 0-100
- reasons: Array of objects with category, score, explanation
- strengths: Array of key strengths
- weaknesses: Array of potential weaknesses

Be thorough and objective in your analysis.
```

**3. Examples (Future Enhancement):**

```
Example:
Job: Medical Interpreter (EN-VI)
Interpreter: 5 years medical, Native EN, Fluent VI
Score: 95/100
Reason: Perfect language match, strong specialization
```

### 8.3. Prompt Length Optimization

**Current:** ~500-800 tokens

**Optimization:**
- Keep essential information
- Remove redundant text
- Use abbreviations where clear
- Structure for readability

**Balance:**
- Too short: Missing context
- Too long: Higher cost, slower
- Optimal: ~500-800 tokens

## 9. Response Format và Schema

### 9.1. Current Approach

1. Use `response_format={"type": "json_object"}`
2. Define schema trong prompt
3. Parse và validate với Pydantic

### 9.2. Schema Definition Best Practices

**1. Be Explicit:**

```
{
  "overall_score": {
    "type": "number",
    "description": "Overall suitability score from 0 to 100",
    "minimum": 0,
    "maximum": 100
  }
}
```

**2. Required Fields:**

```
"required": ["overall_score", "reasons", "strengths", "weaknesses"]
```

**3. Nested Structures:**

```
"reasons": {
  "type": "array",
  "items": {
    "type": "object",
    "properties": {...}
  }
}
```

### 9.3. Validation Strategy

```python
# 1. Parse JSON
result = json.loads(response.content)

# 2. Validate với Pydantic
try:
    score = SuitabilityScore(**result)
except ValidationError as e:
    # Handle invalid response
    # Retry or use fallback
```

## 10. Error Handling và Retries

### 10.1. Common Errors

**1. Rate Limiting:**
- Error: `429 Too Many Requests`
- Solution: Implement exponential backoff

**2. Invalid JSON:**
- Error: JSON parse error
- Solution: Validate và retry

**3. Timeout:**
- Error: Request timeout
- Solution: Increase timeout, retry

### 10.2. Retry Strategy

```python
import time
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def call_openai_with_retry(...):
    try:
        response = await client.chat.completions.create(...)
        return response
    except RateLimitError:
        # Wait and retry
        raise
    except APIError:
        # Log and retry
        raise
```

## 11. Cost Optimization Strategies

### 11.1. Token Usage

**Input Tokens:**
- System message: ~50 tokens
- User prompt: ~500-800 tokens
- **Total:** ~550-850 tokens per request

**Output Tokens:**
- JSON response: ~300-500 tokens
- **Total:** ~300-500 tokens per request

**Cost per Request (GPT-4 Turbo):**
- Input: ~$0.01-0.017
- Output: ~$0.009-0.015
- **Total:** ~$0.019-0.032 per match

### 11.2. Optimization Techniques

**1. Prompt Optimization:**
- Remove redundant text
- Use concise language
- Keep essential info only

**2. Caching:**
- Cache results cho same job-interpreter pairs
- Reduce duplicate API calls

**3. Batching:**
- Batch multiple requests (if supported)
- Reduce overhead

**4. Model Selection:**
- Use GPT-3.5 cho simple cases
- Use GPT-4 cho complex cases

### 11.3. Cost Monitoring

```python
# Track token usage
input_tokens = response.usage.prompt_tokens
output_tokens = response.usage.completion_tokens
total_tokens = response.usage.total_tokens

# Log for monitoring
logger.info(f"Tokens used: {total_tokens} (input: {input_tokens}, output: {output_tokens})")
```

## 12. Performance Optimization

### 12.1. Async Processing

```python
# Current: Sequential
for interpreter in interpreters:
    score = await score_suitability(job, interpreter)

# Optimized: Parallel (Future)
scores = await asyncio.gather(*[
    score_suitability(job, interpreter)
    for interpreter in interpreters
])
```

### 12.2. Timeout Configuration

```python
# Set appropriate timeout
timeout = 60  # seconds

response = await client.chat.completions.create(
    ...,
    timeout=timeout
)
```

### 12.3. Connection Pooling

```python
# Reuse client instance
client = OpenAI(api_key=api_key)
# Don't create new client for each request
```

## 13. Quality Assurance

### 13.1. Response Validation

```python
# 1. Check response structure
assert "overall_score" in result
assert "reasons" in result

# 2. Validate score range
assert 0 <= result["overall_score"] <= 100

# 3. Validate with Pydantic
score = SuitabilityScore(**result)
```

### 13.2. Quality Metrics

**Track:**
- Response time
- Token usage
- Error rate
- Score distribution
- User feedback

### 13.3. A/B Testing

Test different configurations:
- Different temperatures
- Different prompts
- Different models

Compare results để tìm best configuration.

## 14. Recommended Configuration

### 14.1. Current Optimal Settings

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

### 14.2. For Different Scenarios

**High Quality (Current):**
```python
model = "gpt-4-turbo-preview"
temperature = 0.3
```

**Cost Optimized:**
```python
model = "gpt-3.5-turbo"
temperature = 0.3
```

**Fast Processing:**
```python
model = "gpt-3.5-turbo"
temperature = 0.2
max_tokens = 500
```

## 15. Monitoring và Tuning

### 15.1. Key Metrics

1. **Accuracy**: So sánh với human evaluation
2. **Consistency**: Score variance cho cùng input
3. **Response Time**: Average latency
4. **Cost**: Tokens per request
5. **Error Rate**: Failed requests

### 15.2. Tuning Process

1. **Baseline**: Measure current performance
2. **Experiment**: Try different configurations
3. **Compare**: Evaluate results
4. **Iterate**: Refine based on findings

### 15.3. Continuous Improvement

- Monitor production metrics
- Collect user feedback
- A/B test improvements
- Update configurations regularly

## Kết Luận

Tối ưu hóa OpenAI configuration là một quá trình liên tục:

1. **Start với defaults** (GPT-4, temperature=0.3)
2. **Monitor performance** và costs
3. **Experiment** với different settings
4. **Measure** và compare
5. **Iterate** để improve

Configuration hiện tại đã được optimize cho matching tasks, nhưng có thể fine-tune thêm dựa trên real-world usage và feedback.

