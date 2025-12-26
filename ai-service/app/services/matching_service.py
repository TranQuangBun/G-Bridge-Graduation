from typing import List
import time
import asyncio
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
    BatchScoreSuitabilityRequest,
    BatchScoreSuitabilityResponse,
    JobScoreResult,
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
        # Store as dict first to avoid validation error (match_priority must be >= 1)
        matches_data: List[dict] = []
        for interpreter in request.interpreters:
            suitability_score = await self.openai_service.score_suitability(
                request.job, interpreter
            )
            matches_data.append({
                "interpreter_id": interpreter.id,
                "suitability_score": suitability_score,
            })

        # Sort by score (descending) and assign priority
        matches_data.sort(key=lambda x: x["suitability_score"].overall_score, reverse=True)
        
        # Create JobInterpreterMatch objects with correct priority
        matches: List[JobInterpreterMatch] = []
        for idx, match_data in enumerate(matches_data, start=1):
            matches.append(
                JobInterpreterMatch(
                    interpreter_id=match_data["interpreter_id"],
                    suitability_score=match_data["suitability_score"],
                    match_priority=idx,  # Set priority based on sorted order
                )
            )

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

        print("=" * 80)
        print("FILTER_APPLICATIONS - START")
        print(f"Job ID: {request.job.id}")
        print(f"Job Title: {request.job.title}")
        print(f"Total Applications: {len(request.applications)}")
        print(f"Min Score: {request.min_score}")
        print(f"Max Results: {request.max_results}")
        print("=" * 80)

        if not request.applications:
            raise ValidationException("At least one application is required")

        filtered_applications: List[FilteredApplication] = []

        # Score each application
        processed_count = 0
        skipped_count = 0
        for idx, app in enumerate(request.applications, start=1):
            try:
                app_id = app.get("id", 0)
                interpreter_id = app.get("interpreter_id", 0)
                print(f"\n--- Processing Application {idx}/{len(request.applications)} ---")
                print(f"Application ID: {app_id}")
                print(f"Interpreter ID: {interpreter_id}")

                # Extract interpreter profile from application
                interpreter_data = app.get("interpreter", {})
                if not interpreter_data or not interpreter_data.get("id"):
                    print(f"❌ Skipping application {app_id}: missing interpreter data")
                    skipped_count += 1
                    continue

                # Build InterpreterProfileInput from application data
                try:
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
                    print(f"✓ Interpreter Profile created: ID={interpreter.id}, Languages={len(interpreter.languages)}, Specializations={len(interpreter.specializations)}")
                except Exception as e:
                    print(f"❌ Error creating InterpreterProfileInput for app {app_id}: {str(e)}")
                    skipped_count += 1
                    continue

                # Score suitability
                try:
                    suitability_score = await self.openai_service.score_suitability(
                        request.job, interpreter
                    )
                    print(f"✓ Suitability Score: {suitability_score.overall_score:.2f}")
                    print(f"  - Score Level: {suitability_score.score_level}")
                    print(f"  - Recommendation: {suitability_score.recommendation}")
                    print(f"  - Strengths: {len(suitability_score.strengths)} items")
                    print(f"  - Weaknesses: {len(suitability_score.weaknesses)} items")
                    print(f"  - Reasons: {len(suitability_score.reasons)} items")
                    if suitability_score.reasons:
                        print(f"  - Top Reasons:")
                        for reason in suitability_score.reasons[:3]:  # Show top 3 reasons
                            print(f"    • {reason.category}: {reason.score:.1f} - {reason.explanation[:60]}...")
                except Exception as e:
                    print(f"❌ Error scoring suitability for app {app_id}: {str(e)}")
                    skipped_count += 1
                    continue

                # Filter by minimum score
                if suitability_score.overall_score >= request.min_score:
                    # Store as dict first, will create FilteredApplication after sorting
                    filtered_applications.append({
                        "application_id": app_id,
                        "interpreter_id": interpreter.id,
                        "suitability_score": suitability_score,
                    })
                    print(f"✓ Application {app_id} passed filter (score >= {request.min_score})")
                    processed_count += 1
                else:
                    print(f"⚠ Application {app_id} filtered out (score {suitability_score.overall_score:.2f} < {request.min_score})")
                    skipped_count += 1
            except Exception as e:
                print(f"❌ Unexpected error processing application {app.get('id')}: {str(e)}")
                import traceback
                print(traceback.format_exc())
                skipped_count += 1
                continue

        print("\n" + "=" * 80)
        print("FILTERING & RANKING RESULTS")
        print(f"Total processed: {processed_count}")
        print(f"Total skipped: {skipped_count}")
        print(f"Applications passed filter: {len(filtered_applications)}")
        print("=" * 80)

        # Sort by score (descending) with tie-breakers for consistent ranking
        # Primary: overall_score (descending)
        # Secondary: highest reason score (descending) - for applications with same overall score
        # Tertiary: application_id (ascending) - for stable ordering
        def get_sort_key(app_data):
            score = app_data["suitability_score"]
            overall = score.overall_score
            
            # Get the highest reason score as tie-breaker
            max_reason_score = 0
            if score.reasons:
                max_reason_score = max([r.score for r in score.reasons], default=0)
            
            # Use application_id for final tie-breaker (stable ordering)
            app_id = app_data["application_id"]
            
            # Return tuple for multi-level sorting: (primary, secondary, tertiary)
            # Negative for descending order, positive for ascending
            return (-overall, -max_reason_score, app_id)
        
        filtered_applications.sort(key=get_sort_key)
        
        # Create FilteredApplication objects with proper rank
        ranked_applications = []
        for idx, app_data in enumerate(filtered_applications, start=1):
            ranked_applications.append(
                FilteredApplication(
                    application_id=app_data["application_id"],
                    interpreter_id=app_data["interpreter_id"],
                    suitability_score=app_data["suitability_score"],
                    rank=idx,
                )
            )

        # Limit results
        ranked_applications = ranked_applications[: request.max_results]

        processing_time = (time.time() - start_time) * 1000  # Convert to ms

        print("\n" + "=" * 80)
        print("FINAL RANKED RESULTS (Top {}):".format(len(ranked_applications)))
        for app in ranked_applications:
            max_reason_score = max([r.score for r in app.suitability_score.reasons], default=0) if app.suitability_score.reasons else 0
            print(f"  Rank {app.rank}: App ID={app.application_id}, Interpreter ID={app.interpreter_id}, "
                  f"Score={app.suitability_score.overall_score:.2f} ({app.suitability_score.score_level}), "
                  f"Max Reason Score={max_reason_score:.1f}")
        print("=" * 80)

        print("\n" + "=" * 80)
        print("FILTER_APPLICATIONS - END")
        print(f"Total Applications: {len(request.applications)}")
        print(f"Filtered Count: {len(ranked_applications)}")
        print(f"Processing Time: {round(processing_time, 2)}ms")
        print("=" * 80 + "\n")

        return FilterApplicationsResponse(
            job_id=request.job.id,
            total_applications=len(request.applications),
            filtered_count=len(ranked_applications),
            filtered_applications=ranked_applications,
            processing_time_ms=round(processing_time, 2),
        )

    async def batch_score_suitability(
        self, request: BatchScoreSuitabilityRequest
    ) -> BatchScoreSuitabilityResponse:
        """
        Score the suitability of one interpreter for multiple jobs in a SINGLE OpenAI API call.
        This avoids rate limiting by making only one request instead of multiple parallel requests.
        """
        start_time = time.time()

        if not request.jobs:
            raise ValidationException("At least one job is required")

        print(f"\n🎯 MatchingService: Starting batch scoring")
        print(f"   Interpreter ID: {request.interpreter.id}")
        print(f"   Jobs to score: {len(request.jobs)}")

        # Call OpenAI service with batch method - SINGLE API CALL
        suitability_scores = await self.openai_service.batch_score_suitability(
            request.jobs, request.interpreter
        )

        # Build results - map scores to jobs by index
        job_scores: List[JobScoreResult] = []
        for idx, score in enumerate(suitability_scores):
            if idx < len(request.jobs):
                job_scores.append(
                    JobScoreResult(
                        job_id=request.jobs[idx].id,
                        suitability_score=score,
                    )
                )

        # Sort by score (descending)
        job_scores.sort(
            key=lambda x: x.suitability_score.overall_score, reverse=True
        )

        processing_time = (time.time() - start_time) * 1000  # Convert to ms

        print(f"⏱️  Processing time: {round(processing_time, 2)}ms")
        print(f"📊 Top 3 scores:")
        for i, js in enumerate(job_scores[:3], 1):
            print(f"   {i}. Job {js.job_id}: {js.suitability_score.overall_score:.1f}%")

        return BatchScoreSuitabilityResponse(
            interpreter_id=request.interpreter.id,
            total_jobs=len(request.jobs),
            job_scores=job_scores,
            processing_time_ms=round(processing_time, 2),
        )

