from functools import lru_cache
import urllib.parse as up

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

            # PyMySQL dialect in SQLAlchemy does not accept ?ssl-mode= query param.
            # Strip ssl-mode / ssl_mode from query string to avoid TypeError.
            if "pymysql" in url and "?" in url:
                parsed = up.urlparse(url)
                qs = up.parse_qs(parsed.query)
                qs.pop("ssl-mode", None)
                qs.pop("ssl_mode", None)
                new_query = up.urlencode(qs, doseq=True)
                url = up.urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))

            return url

        return (
            "mysql+pymysql://"
            f"{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
            "?charset=utf8mb4"
        )

    @property
    def database_connect_args(self) -> dict:
        args = {}
        raw = (self.database_url_env or "").lower()
        if "ssl" in raw or "aivencloud" in raw or "tidbcloud" in raw:
            args["ssl"] = {}
        return args


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
