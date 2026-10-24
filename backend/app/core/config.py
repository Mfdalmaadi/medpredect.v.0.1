from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MedPredict AI API"
    app_env: str = "development"
    app_debug: bool = True
    api_v1_prefix: str = "/api/v1"

    database_url_env: str | None = Field(default=None, validation_alias="DATABASE_URL")
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "medpredict"
    mysql_password: str = Field(default="medpredict_password", repr=False)
    mysql_database: str = "medpredict_ai"

    database_pool_size: int = 5
    database_max_overflow: int = 10
    database_pool_recycle: int = 1800

    jwt_secret_key: str = Field(default="change_this_secret_key_in_development", repr=False)
    jwt_refresh_secret_key: str = Field(default="change_this_refresh_secret_key_in_development", repr=False)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    high_risk_notification_threshold: float = 0.66

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,https://medpredect.vercel.app"
    cors_origin_regex: str | None = r"^https://.*\.vercel\.app$"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def database_url(self) -> str:
        if self.database_url_env and self.database_url_env.strip():
            url = self.database_url_env.strip()
            if url.startswith("mysql://"):
                url = "mysql+pymysql://" + url[len("mysql://"):]
            elif url.startswith("postgres://"):
                url = "postgresql+psycopg2://" + url[len("postgres://"):]
            elif url.startswith("postgresql://"):
                url = "postgresql+psycopg2://" + url[len("postgresql://"):]
            return url

        return (
            "mysql+pymysql://"
            f"{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
            "?charset=utf8mb4"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
