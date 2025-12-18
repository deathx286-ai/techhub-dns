from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str

    # Inflow API
    inflow_api_url: str = "https://cloudapi.inflowinventory.com"
    inflow_company_id: str = "6eb6abe4-d92a-4130-a15e-64d3b7278b81"
    inflow_api_key: Optional[str] = None
    azure_key_vault_url: Optional[str] = None

    # Teams
    # Teams webhook URL is stored in database, not here

    # CORS
    frontend_url: str = "http://localhost:5173"

    # Auth (structure only)
    secret_key: str = "change-me-in-production"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
