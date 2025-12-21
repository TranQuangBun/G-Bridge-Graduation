from fastapi import HTTPException, status


class AIServiceException(HTTPException):
    """Base exception for AI service errors"""
    def __init__(self, detail: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(status_code=status_code, detail=detail)


class OpenAIException(AIServiceException):
    """Exception for OpenAI API errors"""
    def __init__(self, detail: str = "OpenAI API error"):
        super().__init__(detail=detail, status_code=status.HTTP_502_BAD_GATEWAY)


class ValidationException(AIServiceException):
    """Exception for validation errors"""
    def __init__(self, detail: str = "Validation error"):
        super().__init__(detail=detail, status_code=status.HTTP_400_BAD_REQUEST)

