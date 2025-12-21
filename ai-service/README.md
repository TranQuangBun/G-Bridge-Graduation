# AI Matching Service

> AI-powered job-interpreter matching service using OpenAI GPT-4 with structured output

![Python](https://img.shields.io/badge/python-3.11+-blue)
![FastAPI](https://img.shields.io/badge/fastapi-latest-green)
![OpenAI](https://img.shields.io/badge/openai-gpt--4-orange)

---

## Tổng quan

AI Matching Service là một microservice được xây dựng bằng Python FastAPI, sử dụng OpenAI GPT-4 để thực hiện intelligent matching giữa job posts và interpreter profiles. Service này áp dụng các kỹ thuật **Prompt Engineering** và **Structured Output** để đảm bảo kết quả chính xác và nhất quán.

---

## Tính năng

| Feature | Description |
|---------|-------------|
| **Job-Interpreter Matching** | Match một job với nhiều interpreter profiles và trả về kết quả đã được rank |
| **Suitability Scoring** | Đánh giá chi tiết mức độ phù hợp của một interpreter với một job cụ thể |
| **Application Filtering** | Lọc và xếp hạng các job applications dựa trên AI suitability scoring |

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **FastAPI** | Modern Python web framework |
| **OpenAI GPT-4** | Large Language Model cho intelligent matching |
| **Pydantic** | Data validation và settings management |
| **Structured Output** | JSON schema-based response formatting |

---

## Quick Start

### Prerequisites

| Requirement | Version | Notes |
|------------|---------|-------|
| Python | 3.11+ | Required |
| OpenAI API key | - | Lấy tại https://platform.openai.com/ |

### Installation

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env và thêm OpenAI API key
OPENAI_API_KEY=sk-proj-your-key-here
```

### Run Locally

```bash
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

### Run with Docker

```bash
# Từ project root
docker-compose up ai-service
```

Service sẽ chạy tại: **http://localhost:5000**

---

## API Endpoints

### Health Check

```http
GET /api/v1/health
```

**Response:**

```json
{
  "status": "healthy",
  "service": "ai-matching-service",
  "version": "1.0.0"
}
```

### Match Job to Interpreters

```http
POST /api/v1/match/job
```

**Request Body:**

```json
{
  "job": {
    "id": 1,
    "title": "Medical Interpreter",
    "descriptions": "Provide interpretation services for medical consultations",
    "required_languages": [
      {"language": "English", "level": "Native"},
      {"language": "Vietnamese", "level": "Fluent"}
    ],
    "domains": [
      {"domain": "Medical", "importance": "required"}
    ],
    "salary_range": {"min": 50, "max": 70, "currency": "USD"}
  },
  "interpreters": [
    {
      "id": 1,
      "languages": [
        {"language": "English", "level": "Native"},
        {"language": "Vietnamese", "level": "Fluent"}
      ],
      "specializations": [
        {"specialization": "Medical", "years_experience": 5}
      ],
      "hourly_rate": 60,
      "experience_years": 7
    }
  ],
  "max_results": 10
}
```

**Response:**

```json
{
  "job_id": 1,
  "total_interpreters": 5,
  "matched_interpreters": [
    {
      "interpreter_id": 1,
      "suitability_score": {
        "overall_score": 95.0,
        "score_level": "excellent",
        "reasons": [
          {
            "category": "language",
            "score": 100.0,
            "explanation": "Perfect language match with required proficiency levels"
          },
          {
            "category": "specialization",
            "score": 95.0,
            "explanation": "Strong specialization alignment with 5 years experience"
          }
        ],
        "strengths": [
          "Native proficiency in required languages",
          "Extensive medical interpretation experience"
        ],
        "weaknesses": [
          "Rate slightly above job range"
        ],
        "recommendation": "Highly recommended - Excellent match for this position"
      },
      "match_priority": 1
    }
  ],
  "processing_time_ms": 1234.56
}
```

### Score Suitability

```http
POST /api/v1/score/suitability
```

Đánh giá chi tiết mức độ phù hợp của một interpreter với một job cụ thể.

### Filter Applications

```http
POST /api/v1/filter/applications
```

Lọc và xếp hạng các job applications dựa trên AI suitability scoring.

---

## Architecture

```
app/
├── main.py              # FastAPI application entry point
├── api/
│   └── routes.py       # API route handlers
├── core/
│   ├── config.py       # Configuration management
│   └── exceptions.py   # Custom exceptions
├── models/
│   └── schemas.py      # Pydantic models for request/response
└── services/
    ├── openai_service.py    # OpenAI integration
    └── matching_service.py  # Business logic for matching
```

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (required) |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_MODEL` | `gpt-4-turbo-preview` | Model to use |
| `API_PORT` | `5000` | Service port |
| `API_HOST` | `0.0.0.0` | Host address |
| `LOG_LEVEL` | `INFO` | Logging level |
| `ALLOWED_ORIGINS` | `http://localhost:4000,http://localhost:3333` | CORS origins |

> **Note:** Xem chi tiết: [DOCUMENTATION.md](./DOCUMENTATION.md#environment-variables)

---

## Tài liệu chi tiết

| Document | Description |
|----------|-------------|
| **[DOCUMENTATION.md](./DOCUMENTATION.md)** | Tài liệu đầy đủ về: |
| | - Cơ chế hoạt động (Mechanism) |
| | - Tối ưu hóa OpenAI (Optimization) |
| | - Cơ sở lý thuyết (Theoretical Foundation) |
| | - Environment Variables chi tiết |
| | - Best practices và troubleshooting |

---

## Design Principles

1. **Structured Output**: Tất cả AI responses sử dụng JSON schema để đảm bảo format nhất quán
2. **Type Safety**: Pydantic models đảm bảo type validation
3. **Error Handling**: Comprehensive error handling với custom exceptions
4. **Performance**: Async/await cho non-blocking operations
5. **Scalability**: Service-oriented architecture để dễ dàng scale

---

## How It Works

```
1. Nhận Request: Backend gửi job data và interpreter profiles
   ↓
2. Xử Lý: Service gọi OpenAI GPT-4 với structured prompts
   ↓
3. Scoring: AI đánh giá mức độ phù hợp dựa trên nhiều tiêu chí
   ↓
4. Ranking: Sắp xếp kết quả theo suitability score
   ↓
5. Response: Trả về ranked results với detailed analysis
```

> **Note:** Xem chi tiết về mechanism: [DOCUMENTATION.md](./DOCUMENTATION.md#mechanism)

---

## Use Cases

| Use Case | Description |
|----------|-------------|
| **Organization tạo job mới** | Tự động suggest interpreters phù hợp |
| **Organization xem applications** | AI rank applications theo suitability |
| **Interpreter tìm việc** | AI suggest jobs phù hợp với profile |
| **Client tìm interpreter** | AI recommend interpreters cho job cụ thể |

---

## License

ISC
