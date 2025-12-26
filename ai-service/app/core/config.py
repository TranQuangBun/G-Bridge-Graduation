from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # OpenAI Configuration
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"
    
    # Service Configuration
    api_port: int = 5000
    api_host: str = "0.0.0.0"
    log_level: str = "INFO"
    
    # CORS Configuration
    # Parse from comma-separated string or use default list
    allowed_origins: str = "http://localhost:4000,http://localhost:3333"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse allowed_origins from comma-separated string to list"""
        if isinstance(self.allowed_origins, str):
            return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]
        return self.allowed_origins if isinstance(self.allowed_origins, list) else []
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

