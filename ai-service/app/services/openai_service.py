from openai import OpenAI
from typing import Dict, Any, List
import json
from app.core.config import settings
from app.core.exceptions import OpenAIException
from app.models.schemas import (
    SuitabilityScore,
    MatchReason,
    MatchScoreLevel,
    JobInput,
    InterpreterProfileInput,
)


class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
        # Log model being used for debugging
        print(f"OpenAIService initialized with model: {self.model}")

    def _calculate_score_level(self, score: float) -> MatchScoreLevel:
        """Calculate score level from numeric score"""
        if score >= 90:
            return MatchScoreLevel.EXCELLENT
        elif score >= 70:
            return MatchScoreLevel.GOOD
        elif score >= 50:
            return MatchScoreLevel.FAIR
        else:
            return MatchScoreLevel.POOR

    def _get_recommendation(self, score: float) -> str:
        """Get recommendation text based on score"""
        if score >= 90:
            return "Highly recommended - Excellent match with strong alignment across all requirements"
        elif score >= 70:
            return "Good match - Strong candidate with minor gaps that can be addressed"
        elif score >= 50:
            return "Fair match - Candidate has relevant skills but may need additional support or training"
        else:
            return "Poor match - Significant gaps between job requirements and candidate qualifications"

    async def score_suitability(
        self, job: JobInput, interpreter: InterpreterProfileInput
    ) -> SuitabilityScore:
        """
        Score the suitability of an interpreter for a specific job using OpenAI.
        Uses structured output to ensure consistent response format.
        """
        try:
            # Build prompt for suitability scoring
            prompt = self._build_suitability_prompt(job, interpreter)

            # Define structured output schema
            response_schema = {
                "type": "object",
                "properties": {
                    "overall_score": {
                        "type": "number",
                        "description": "Overall suitability score from 0 to 100",
                        "minimum": 0,
                        "maximum": 100,
                    },
                    "reasons": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "category": {
                                    "type": "string",
                                    "description": "Category of match (e.g., 'language', 'specialization', 'experience', 'certification', 'rate')",
                                },
                                "score": {
                                    "type": "number",
                                    "description": "Score for this category from 0 to 100",
                                    "minimum": 0,
                                    "maximum": 100,
                                },
                                "explanation": {
                                    "type": "string",
                                    "description": "Detailed explanation of the match in this category",
                                },
                            },
                            "required": ["category", "score", "explanation"],
                        },
                    },
                    "strengths": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Key strengths of the match",
                    },
                    "weaknesses": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Potential weaknesses or gaps",
                    },
                },
                "required": ["overall_score", "reasons", "strengths", "weaknesses"],
            }

            # Call OpenAI with structured output
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert HR and recruitment AI assistant specializing in matching interpreters with job opportunities. Analyze job requirements and interpreter profiles to provide accurate suitability scores.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,  # Lower temperature for more consistent scoring
            )

            # Parse response
            result = json.loads(response.choices[0].message.content)

            # Build SuitabilityScore object
            reasons = [
                MatchReason(
                    category=r["category"],
                    score=r["score"],
                    explanation=r["explanation"],
                )
                for r in result.get("reasons", [])
            ]

            overall_score = float(result.get("overall_score", 0))
            score_level = self._calculate_score_level(overall_score)
            recommendation = self._get_recommendation(overall_score)

            return SuitabilityScore(
                overall_score=overall_score,
                score_level=score_level,
                reasons=reasons,
                strengths=result.get("strengths", []),
                weaknesses=result.get("weaknesses", []),
                recommendation=recommendation,
            )

        except Exception as e:
            error_msg = str(e)
            # Log more details for debugging
            if hasattr(e, 'response') and hasattr(e.response, 'status_code'):
                error_msg = f"OpenAI API error (status {e.response.status_code}): {error_msg}"
            elif "404" in error_msg or "Not Found" in error_msg:
                error_msg = f"Model '{self.model}' not found. Please check if the model name is correct and your API key has access to it. Error: {error_msg}"
            raise OpenAIException(f"Error scoring suitability: {error_msg}")

    def _build_suitability_prompt(
        self, job: JobInput, interpreter: InterpreterProfileInput
    ) -> str:
        """Build prompt for suitability scoring"""
        prompt = f"""Analyze the suitability of an interpreter for a job position and provide a detailed suitability score.

JOB REQUIREMENTS:
- Title: {job.title}
- Description: {job.descriptions or 'N/A'}
- Responsibilities: {job.responsibility or 'N/A'}
- Location: {job.province or 'N/A'}
- Working Mode: {job.working_mode or 'N/A'}
- Salary Range: ${job.min_salary or 'N/A'} - ${job.max_salary or 'N/A'}
- Required Languages: {', '.join([f"{lang.language} ({lang.level})" for lang in job.required_languages]) or 'N/A'}
- Required Domains/Specializations: {', '.join([d.domain for d in job.domains]) or 'N/A'}
- Required Certifications: {', '.join(job.required_certificates) or 'N/A'}

INTERPRETER PROFILE:
- Languages: {', '.join([f"{lang.language} ({lang.level})" for lang in interpreter.languages]) or 'N/A'}
- Specializations: {', '.join([f"{spec.specialization}" for spec in interpreter.specializations]) or 'N/A'}
- Experience: {interpreter.experience_years or 'N/A'} years
- Hourly Rate: ${interpreter.hourly_rate or 'N/A'} {interpreter.currency or 'USD'}
- Certifications: {', '.join([cert.name for cert in interpreter.certifications]) or 'N/A'}
- Portfolio: {interpreter.portfolio or 'N/A'}
- Rating: {interpreter.rating or 'N/A'}/5.0
- Completed Jobs: {interpreter.completed_jobs or 0}

EVALUATION CRITERIA:
1. Language Match: How well do the interpreter's languages match the job requirements?
2. Specialization Match: How well do the interpreter's specializations align with the job domains?
3. Experience Level: Is the interpreter's experience appropriate for the job?
4. Certification Match: Does the interpreter have required certifications?
5. Rate Compatibility: Is the interpreter's rate within acceptable range for the job?
6. Overall Fit: Consider all factors together for overall suitability.

Provide a JSON response with:
- overall_score: A number from 0-100 representing overall suitability
- reasons: Array of objects with category, score (0-100), and explanation for each evaluation criterion
- strengths: Array of key strengths (at least 2-3 items)
- weaknesses: Array of potential weaknesses or gaps (at least 1-2 items)

Be thorough and objective in your analysis."""
        return prompt

