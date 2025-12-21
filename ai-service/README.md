# AI Matching Service

AI-powered job-interpreter matching service using OpenAI GPT-4 with structured output.

## Features

- **Job-Interpreter Matching**: Match a job post to multiple interpreter profiles and return ranked results
- **Suitability Scoring**: Score the suitability of a single interpreter for a specific job with detailed analysis
- **Application Filtering**: Filter and rank job applications based on AI suitability scoring

## Technology Stack

- **FastAPI**: Modern Python web framework
- **OpenAI GPT-4**: Large Language Model for intelligent matching
- **Pydantic**: Data validation and settings management
- **Structured Output**: JSON schema-based response formatting

## Setup

### Prerequisites

- Python 3.11+
- OpenAI API key

### Environment Variables

Create a `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
API_PORT=5000
API_HOST=0.0.0.0
LOG_LEVEL=INFO
ALLOWED_ORIGINS=http://localhost:4000,http://localhost:3333
```

### Installation

```bash
pip install -r requirements.txt
```

### Run Locally

```bash
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

### Run with Docker

```bash
docker-compose up ai-service
```

## API Endpoints

### Health Check

```
GET /api/v1/health
```

### Match Job to Interpreters

```
POST /api/v1/match/job
```

**Request Body:**
```json
{
  "job": {
    "id": 1,
    "title": "Medical Interpreter",
    "descriptions": "...",
    "required_languages": [
      {"language": "English", "level": "Native"}
    ],
    "domains": [
      {"domain": "Medical", "importance": "required"}
    ]
  },
  "interpreters": [
    {
      "id": 1,
      "languages": [
        {"language": "English", "level": "Native"}
      ],
      "specializations": [
        {"specialization": "Medical"}
      ]
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
        "reasons": [...],
        "strengths": [...],
        "weaknesses": [...],
        "recommendation": "..."
      },
      "match_priority": 1
    }
  ],
  "processing_time_ms": 1234.56
}
```

### Score Suitability

```
POST /api/v1/score/suitability
```

### Filter Applications

```
POST /api/v1/filter/applications
```

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

## Design Principles

1. **Structured Output**: All AI responses use JSON schema for consistent formatting
2. **Type Safety**: Pydantic models ensure type validation
3. **Error Handling**: Comprehensive error handling with custom exceptions
4. **Performance**: Async/await for non-blocking operations
5. **Scalability**: Service-oriented architecture for easy scaling

