from fastapi import APIRouter, HTTPException
from app.services.matching_service import MatchingService
from app.models.schemas import (
    MatchJobRequest,
    MatchJobResponse,
    ScoreSuitabilityRequest,
    ScoreSuitabilityResponse,
    FilterApplicationsRequest,
    FilterApplicationsResponse,
    BatchScoreSuitabilityRequest,
    BatchScoreSuitabilityResponse,
    HealthResponse,
)

router = APIRouter(prefix="/api/v1", tags=["AI Matching"])

matching_service = MatchingService()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(status="healthy")


@router.post("/match/job", response_model=MatchJobResponse)
async def match_job_to_interpreters(request: MatchJobRequest):
    """
    Match a job post to multiple interpreter profiles.
    Returns ranked list of interpreters with suitability scores.
    """
    try:
        return await matching_service.match_job_to_interpreters(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/score/suitability", response_model=ScoreSuitabilityResponse)
async def score_suitability(request: ScoreSuitabilityRequest):
    """
    Score the suitability of a single interpreter for a specific job.
    Returns detailed suitability analysis.
    """
    try:
        return await matching_service.score_suitability(request)
    except Exception as e:
        import traceback
        error_detail = str(e)
        # Log full traceback for debugging
        print(f"Error in score_suitability: {error_detail}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_detail)


@router.post("/filter/applications", response_model=FilterApplicationsResponse)
async def filter_applications(request: FilterApplicationsRequest):
    """
    Filter and rank job applications based on AI suitability scoring.
    Returns filtered applications sorted by suitability score.
    """
    try:
        return await matching_service.filter_applications(request)
    except Exception as e:
        import traceback
        error_detail = str(e)
        print(f"Error in filter_applications: {error_detail}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_detail)


@router.post("/score/batch", response_model=BatchScoreSuitabilityResponse)
async def batch_score_suitability(request: BatchScoreSuitabilityRequest):
    """
    Score the suitability of one interpreter for multiple jobs in a single request.
    This is more efficient than calling score/suitability multiple times.
    Returns scores for all jobs sorted by suitability (descending).
    """
    try:
        return await matching_service.batch_score_suitability(request)
    except Exception as e:
        import traceback
        error_detail = str(e)
        print(f"Error in batch_score_suitability: {error_detail}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_detail)

