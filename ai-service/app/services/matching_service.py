from typing import List
import time
from app.services.openai_service import OpenAIService
from app.models.schemas import (
    JobInput,
    InterpreterProfileInput,
    JobInterpreterMatch,
    MatchJobRequest,
    MatchJobResponse,
    ScoreSuitabilityRequest,
    ScoreSuitabilityResponse,
    FilterApplicationsRequest,
    FilteredApplication,
    FilterApplicationsResponse,
)
from app.core.exceptions import ValidationException


class MatchingService:
    def __init__(self):
        self.openai_service = OpenAIService()

    async def match_job_to_interpreters(
        self, request: MatchJobRequest
    ) -> MatchJobResponse:
        """
        Match a job to multiple interpreters and return ranked results.
        """
        start_time = time.time()

        if not request.interpreters:
            raise ValidationException("At least one interpreter profile is required")

        # Score each interpreter
        matches: List[JobInterpreterMatch] = []
        for interpreter in request.interpreters:
            suitability_score = await self.openai_service.score_suitability(
                request.job, interpreter
            )
            matches.append(
                JobInterpreterMatch(
                    interpreter_id=interpreter.id,
                    suitability_score=suitability_score,
                    match_priority=0,  # Will be set after sorting
                )
            )

        # Sort by score (descending) and assign priority
        matches.sort(key=lambda x: x.suitability_score.overall_score, reverse=True)
        for idx, match in enumerate(matches, start=1):
            match.match_priority = idx

        # Limit results
        matched_interpreters = matches[: request.max_results]

        processing_time = (time.time() - start_time) * 1000  # Convert to ms

        return MatchJobResponse(
            job_id=request.job.id,
            total_interpreters=len(request.interpreters),
            matched_interpreters=matched_interpreters,
            processing_time_ms=round(processing_time, 2),
        )

    async def score_suitability(
        self, request: ScoreSuitabilityRequest
    ) -> ScoreSuitabilityResponse:
        """
        Score the suitability of a single interpreter for a job.
        """
        start_time = time.time()

        suitability_score = await self.openai_service.score_suitability(
            request.job, request.interpreter
        )

        processing_time = (time.time() - start_time) * 1000  # Convert to ms

        return ScoreSuitabilityResponse(
            interpreter_id=request.interpreter.id,
            suitability_score=suitability_score,
            processing_time_ms=round(processing_time, 2),
        )

    async def filter_applications(
        self, request: FilterApplicationsRequest
    ) -> FilterApplicationsResponse:
        """
        Filter and rank job applications based on suitability scores.
        """
        start_time = time.time()

        if not request.applications:
            raise ValidationException("At least one application is required")

        filtered_applications: List[FilteredApplication] = []

        # Score each application
        for app in request.applications:
            # Extract interpreter profile from application
            interpreter_data = app.get("interpreter", {})
            if not interpreter_data:
                continue

            # Build InterpreterProfileInput from application data
            interpreter = InterpreterProfileInput(
                id=interpreter_data.get("id", app.get("interpreter_id", 0)),
                languages=interpreter_data.get("languages", []),
                specializations=interpreter_data.get("specializations", []),
                experience_years=interpreter_data.get("experience_years"),
                hourly_rate=interpreter_data.get("hourly_rate"),
                currency=interpreter_data.get("currency", "USD"),
                certifications=interpreter_data.get("certifications", []),
                portfolio=interpreter_data.get("portfolio"),
                rating=interpreter_data.get("rating"),
                completed_jobs=interpreter_data.get("completed_jobs"),
                availability=interpreter_data.get("availability"),
            )

            # Score suitability
            suitability_score = await self.openai_service.score_suitability(
                request.job, interpreter
            )

            # Filter by minimum score
            if suitability_score.overall_score >= request.min_score:
                filtered_applications.append(
                    FilteredApplication(
                        application_id=app.get("id", 0),
                        interpreter_id=interpreter.id,
                        suitability_score=suitability_score,
                        rank=0,  # Will be set after sorting
                    )
                )

        # Sort by score (descending) and assign rank
        filtered_applications.sort(
            key=lambda x: x.suitability_score.overall_score, reverse=True
        )
        for idx, app in enumerate(filtered_applications, start=1):
            app.rank = idx

        # Limit results
        filtered_applications = filtered_applications[: request.max_results]

        processing_time = (time.time() - start_time) * 1000  # Convert to ms

        return FilterApplicationsResponse(
            job_id=request.job.id,
            total_applications=len(request.applications),
            filtered_count=len(filtered_applications),
            filtered_applications=filtered_applications,
            processing_time_ms=round(processing_time, 2),
        )

