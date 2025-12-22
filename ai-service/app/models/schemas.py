from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


# Enums
class MatchScoreLevel(str, Enum):
    EXCELLENT = "excellent"  # 90-100
    GOOD = "good"  # 70-89
    FAIR = "fair"  # 50-69
    POOR = "poor"  # 0-49


# Job Models
class LanguageRequirement(BaseModel):
    language: str = Field(..., description="Language name")
    level: str = Field(..., description="Proficiency level (e.g., 'Native', 'Fluent', 'Intermediate')")


class DomainRequirement(BaseModel):
    domain: str = Field(..., description="Domain/specialization name")
    importance: Optional[str] = Field(None, description="Importance level (e.g., 'required', 'preferred')")


class JobInput(BaseModel):
    """Input model for job post"""
    id: int
    title: str
    descriptions: Optional[str] = None
    responsibility: Optional[str] = None
    benefits: Optional[str] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    province: Optional[str] = None
    working_mode: Optional[str] = None
    required_languages: List[LanguageRequirement] = Field(default_factory=list)
    domains: List[DomainRequirement] = Field(default_factory=list)
    required_certificates: List[str] = Field(default_factory=list)


# Interpreter Profile Models
class InterpreterLanguage(BaseModel):
    language: str
    level: str
    certified: Optional[bool] = False


class InterpreterSpecialization(BaseModel):
    specialization: str
    experience_years: Optional[int] = None


class InterpreterCertification(BaseModel):
    name: str
    issuer: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None


class InterpreterProfileInput(BaseModel):
    """Input model for interpreter profile"""
    id: int
    languages: List[InterpreterLanguage] = Field(default_factory=list)
    specializations: List[InterpreterSpecialization] = Field(default_factory=list)
    experience_years: Optional[int] = None
    hourly_rate: Optional[float] = None
    currency: Optional[str] = "USD"
    certifications: List[InterpreterCertification] = Field(default_factory=list)
    portfolio: Optional[str] = None
    rating: Optional[float] = None
    completed_jobs: Optional[int] = None
    availability: Optional[Dict[str, Any]] = None


# Matching Models
class MatchReason(BaseModel):
    """Reason for match score"""
    category: str = Field(..., description="Category of match (e.g., 'language', 'specialization', 'experience')")
    score: float = Field(..., ge=0, le=100, description="Score for this category")
    explanation: str = Field(..., description="Explanation of the match")


class SuitabilityScore(BaseModel):
    """Suitability score for a job-interpreter match"""
    overall_score: float = Field(..., ge=0, le=100, description="Overall suitability score (0-100)")
    score_level: MatchScoreLevel = Field(..., description="Score level category")
    reasons: List[MatchReason] = Field(default_factory=list, description="Detailed reasons for the score")
    strengths: List[str] = Field(default_factory=list, description="Key strengths of the match")
    weaknesses: List[str] = Field(default_factory=list, description="Potential weaknesses or gaps")
    recommendation: str = Field(..., description="Recommendation text (e.g., 'Highly recommended', 'Good match', etc.)")


class JobInterpreterMatch(BaseModel):
    """Match result between a job and an interpreter"""
    interpreter_id: int
    suitability_score: SuitabilityScore
    match_priority: int = Field(..., ge=1, description="Priority ranking (1 = highest priority)")


class MatchJobRequest(BaseModel):
    """Request model for matching interpreters to a job"""
    job: JobInput
    interpreters: List[InterpreterProfileInput] = Field(..., min_items=1, description="List of interpreter profiles to match")
    max_results: Optional[int] = Field(10, ge=1, le=100, description="Maximum number of results to return")


class MatchJobResponse(BaseModel):
    """Response model for job matching"""
    job_id: int
    total_interpreters: int
    matched_interpreters: List[JobInterpreterMatch]
    processing_time_ms: float


class ScoreSuitabilityRequest(BaseModel):
    """Request model for scoring suitability of a single interpreter for a job"""
    job: JobInput
    interpreter: InterpreterProfileInput


class ScoreSuitabilityResponse(BaseModel):
    """Response model for suitability scoring"""
    interpreter_id: int
    suitability_score: SuitabilityScore
    processing_time_ms: float


class FilterApplicationsRequest(BaseModel):
    """Request model for filtering job applications"""
    job: JobInput
    applications: List[Dict[str, Any]] = Field(..., min_items=1, description="List of job applications with interpreter profiles")
    min_score: Optional[float] = Field(50.0, ge=0, le=100, description="Minimum suitability score threshold")
    max_results: Optional[int] = Field(20, ge=1, le=100, description="Maximum number of results to return")


class FilteredApplication(BaseModel):
    """Filtered application result"""
    application_id: int
    interpreter_id: int
    suitability_score: SuitabilityScore
    rank: int = Field(..., ge=1, description="Ranking position")


class FilterApplicationsResponse(BaseModel):
    """Response model for filtered applications"""
    job_id: int
    total_applications: int
    filtered_count: int
    filtered_applications: List[FilteredApplication]
    processing_time_ms: float


class JobScoreResult(BaseModel):
    """Score result for a single job"""
    job_id: int
    suitability_score: SuitabilityScore


class BatchScoreSuitabilityRequest(BaseModel):
    """Request model for batch scoring multiple jobs with one interpreter"""
    jobs: List[JobInput] = Field(..., min_items=1, description="List of jobs to score")
    interpreter: InterpreterProfileInput = Field(..., description="Interpreter profile to score against all jobs")


class BatchScoreSuitabilityResponse(BaseModel):
    """Response model for batch suitability scoring"""
    interpreter_id: int
    total_jobs: int
    job_scores: List[JobScoreResult]
    processing_time_ms: float


# Health Check
class HealthResponse(BaseModel):
    status: str
    service: str = "ai-matching-service"
    version: str = "1.0.0"

