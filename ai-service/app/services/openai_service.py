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

    async def batch_score_suitability(
        self, jobs: List[JobInput], interpreter: InterpreterProfileInput
    ) -> List[SuitabilityScore]:
        """
        Score the suitability of an interpreter for multiple jobs in a single OpenAI API call.
        This avoids rate limiting issues by making only one request instead of multiple.
        """
        try:
            print(f"\n{'='*60}")
            print(f"🤖 AI Batch Scoring Request")
            print(f"{'='*60}")
            print(f"📊 Interpreter ID: {interpreter.id}")
            print(f"📋 Number of Jobs: {len(jobs)}")
            print(f"📝 Job IDs: {[job.id for job in jobs]}")
            print(f"🌐 Languages: {[lang.language for lang in interpreter.languages]}")
            print(f"🎯 Specializations: {[spec.specialization for spec in interpreter.specializations]}")
            
            # Build batch prompt for all jobs
            prompt = self._build_batch_suitability_prompt(jobs, interpreter)
            print(f"📏 Prompt length: {len(prompt)} characters")

            # Define structured output schema for batch response
            response_schema = {
                "type": "object",
                "properties": {
                    "scores": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "job_id": {
                                    "type": "integer",
                                    "description": "The ID of the job being scored",
                                },
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
                                            "category": {"type": "string"},
                                            "score": {"type": "number", "minimum": 0, "maximum": 100},
                                            "explanation": {"type": "string"},
                                        },
                                        "required": ["category", "score", "explanation"],
                                    },
                                },
                                "strengths": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                                "weaknesses": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                            },
                            "required": ["job_id", "overall_score", "reasons", "strengths", "weaknesses"],
                        },
                    },
                },
                "required": ["scores"],
            }

            # Call OpenAI with structured output - SINGLE REQUEST
            print(f"🚀 Calling OpenAI API (model: {self.model})...")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert HR and recruitment AI assistant specializing in matching interpreters with job opportunities. Analyze job requirements and interpreter profiles to provide accurate suitability scores. You will receive multiple jobs and need to score each one against the same interpreter profile.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,  # Lower temperature for more consistent scoring
            )

            # Log raw response
            raw_content = response.choices[0].message.content
            print(f"✅ OpenAI API Response received")
            print(f"📦 Raw response length: {len(raw_content)} characters")
            
            # Parse response
            result = json.loads(raw_content)
            scores_data = result.get("scores", [])
            
            print(f"📊 Parsed scores count: {len(scores_data)}")
            print(f"📋 Scores job IDs: {[s.get('job_id') for s in scores_data]}")

            # Validate that we got scores for all jobs
            if len(scores_data) != len(jobs):
                print(f"⚠️  WARNING: Expected {len(jobs)} scores but got {len(scores_data)}")
                print(f"   Received job_ids: {[s.get('job_id') for s in scores_data]}")
                print(f"   Expected job_ids: {[job.id for job in jobs]}")
            else:
                print(f"✅ All {len(jobs)} jobs have scores")

            # Create a map of job_id to score_data for easier lookup
            scores_map = {}
            for score_data in scores_data:
                job_id = score_data.get("job_id")
                if job_id:
                    # Handle both string and int job_id
                    job_id = int(job_id) if isinstance(job_id, (str, int)) else job_id
                    scores_map[job_id] = score_data

            # Build SuitabilityScore objects for each job
            suitability_scores = []
            missing_jobs = []
            
            for idx, job in enumerate(jobs):
                # Try to find score by job_id first
                score_data = scores_map.get(job.id)
                
                # If not found by job_id, try by index (in case job_id is missing from response)
                if not score_data and idx < len(scores_data):
                    score_data = scores_data[idx]
                    # Verify the score_data has a job_id that matches or is missing
                    score_job_id = score_data.get("job_id")
                    if score_job_id and int(score_job_id) != job.id:
                        # This score belongs to a different job, don't use it
                        score_data = None
                
                if not score_data:
                    missing_jobs.append(job.id)
                    print(f"⚠️  WARNING: No score found for job {job.id} (index {idx}), creating default score")
                    # Create a default low score for missing jobs
                    score_data = {
                        "overall_score": 0,
                        "reasons": [
                            {
                                "category": "data_missing",
                                "score": 0,
                                "explanation": "Score not provided by AI service"
                            }
                        ],
                        "strengths": [],
                        "weaknesses": ["Score data missing from AI response"]
                    }
                
                reasons = [
                    MatchReason(
                        category=r["category"],
                        score=r["score"],
                        explanation=r["explanation"],
                    )
                    for r in score_data.get("reasons", [])
                ]

                overall_score = float(score_data.get("overall_score", 0))
                score_level = self._calculate_score_level(overall_score)
                recommendation = self._get_recommendation(overall_score)

                print(f"   Job {job.id}: Score = {overall_score}% ({score_level.value})")

                suitability_scores.append(
                    SuitabilityScore(
                        overall_score=overall_score,
                        score_level=score_level,
                        reasons=reasons,
                        strengths=score_data.get("strengths", []),
                        weaknesses=score_data.get("weaknesses", []),
                        recommendation=recommendation,
                    )
                )

            print(f"\n📈 Final Results Summary:")
            print(f"   Total scores: {len(suitability_scores)}")
            if suitability_scores:
                scores_list = [s.overall_score for s in suitability_scores]
                print(f"   Score range: {min(scores_list):.1f}% - {max(scores_list):.1f}%")
                print(f"   Average score: {sum(scores_list)/len(scores_list):.1f}%")
            print(f"{'='*60}\n")
            
            return suitability_scores

        except Exception as e:
            error_msg = str(e)
            if hasattr(e, 'response') and hasattr(e.response, 'status_code'):
                error_msg = f"OpenAI API error (status {e.response.status_code}): {error_msg}"
            elif "404" in error_msg or "Not Found" in error_msg:
                error_msg = f"Model '{self.model}' not found. Please check if the model name is correct and your API key has access to it. Error: {error_msg}"
            raise OpenAIException(f"Error batch scoring suitability: {error_msg}")

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

    def _build_batch_suitability_prompt(
        self, jobs: List[JobInput], interpreter: InterpreterProfileInput
    ) -> str:
        """Build prompt for batch suitability scoring (multiple jobs, one interpreter)"""
        
        # Build interpreter profile section (same for all jobs)
        interpreter_section = f"""
INTERPRETER PROFILE (to be evaluated against all jobs below):
- Languages: {', '.join([f"{lang.language} ({lang.level})" for lang in interpreter.languages]) or 'N/A'}
- Specializations: {', '.join([f"{spec.specialization}" for spec in interpreter.specializations]) or 'N/A'}
- Experience: {interpreter.experience_years or 'N/A'} years
- Hourly Rate: ${interpreter.hourly_rate or 'N/A'} {interpreter.currency or 'USD'}
- Certifications: {', '.join([cert.name for cert in interpreter.certifications]) or 'N/A'}
- Portfolio: {interpreter.portfolio or 'N/A'}
- Rating: {interpreter.rating or 'N/A'}/5.0
- Completed Jobs: {interpreter.completed_jobs or 0}
"""

        # Build jobs section
        jobs_section = "\n\n=== JOBS TO EVALUATE ===\n\n"
        for idx, job in enumerate(jobs, start=1):
            jobs_section += f"""
JOB #{idx} (ID: {job.id}):
- Title: {job.title}
- Description: {job.descriptions or 'N/A'}
- Responsibilities: {job.responsibility or 'N/A'}
- Location: {job.province or 'N/A'}
- Working Mode: {job.working_mode or 'N/A'}
- Salary Range: ${job.min_salary or 'N/A'} - ${job.max_salary or 'N/A'}
- Required Languages: {', '.join([f"{lang.language} ({lang.level})" for lang in job.required_languages]) or 'N/A'}
- Required Domains/Specializations: {', '.join([d.domain for d in job.domains]) or 'N/A'}
- Required Certifications: {', '.join(job.required_certificates) or 'N/A'}
---
"""

        # Create job ID list for validation
        job_ids_list = [str(job.id) for job in jobs]
        job_ids_str = ", ".join(job_ids_list)
        
        prompt = f"""You are an expert HR and recruitment AI assistant. Your task is to analyze the suitability of ONE interpreter profile against EXACTLY {len(jobs)} different job positions.

CRITICAL REQUIREMENT: You MUST provide a suitability score for EVERY SINGLE job listed below. Do not skip any job, even if the match seems poor.

INTERPRETER PROFILE (to be evaluated against all jobs):
{interpreter_section}

=== LIST OF {len(jobs)} JOBS TO EVALUATE ===
The following are the {len(jobs)} jobs you MUST score. Job IDs: {job_ids_str}

{jobs_section}

EVALUATION CRITERIA (apply to EACH of the {len(jobs)} jobs):
1. Language Match: How well do the interpreter's languages match the job requirements?
2. Specialization Match: How well do the interpreter's specializations align with the job domains?
3. Experience Level: Is the interpreter's experience appropriate for the job?
4. Certification Match: Does the interpreter have required certifications?
5. Rate Compatibility: Is the interpreter's rate within acceptable range for the job?
6. Overall Fit: Consider all factors together for overall suitability.

REQUIRED OUTPUT FORMAT:
Provide a JSON response with a "scores" array. The array MUST contain EXACTLY {len(jobs)} objects - one for each job listed above.

Each score object MUST include:
- job_id: The ID of the job (MUST be one of: {job_ids_str})
- overall_score: A number from 0-100 representing overall suitability for that specific job
- reasons: Array of objects with category, score (0-100), and explanation for each evaluation criterion
- strengths: Array of key strengths (at least 2-3 items) for this specific job match
- weaknesses: Array of potential weaknesses or gaps (at least 1-2 items) for this specific job match

MANDATORY REQUIREMENTS:
1. The "scores" array MUST contain exactly {len(jobs)} objects - no more, no less
2. Each object MUST have a "job_id" field that matches one of the job IDs from the list: {job_ids_str}
3. You MUST evaluate ALL {len(jobs)} jobs - do not skip any job, even if the match is poor
4. The response must be valid JSON

Example structure:
{{
  "scores": [
    {{"job_id": {jobs[0].id}, "overall_score": 85, "reasons": [...], "strengths": [...], "weaknesses": [...]}},
    {{"job_id": {jobs[1].id if len(jobs) > 1 else jobs[0].id}, "overall_score": 72, "reasons": [...], "strengths": [...], "weaknesses": [...]}},
    ... (continue for all {len(jobs)} jobs)
  ]
}}

Remember: You must provide scores for ALL {len(jobs)} jobs. The job IDs you must include are: {job_ids_str}"""
        return prompt

