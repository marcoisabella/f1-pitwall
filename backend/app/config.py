from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    admin_username: str = "admin"
    admin_password: str = "changeme"
    jwt_secret: str = "change-this-to-a-random-secret-key"
    database_url: str = "sqlite+aiosqlite:///./data/f1app.db"
    openf1_base_url: str = "https://api.openf1.org/v1"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
