# config.py
import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 기본 설정
    app_name: str = "FastAPI App"
    debug: bool = False
    enviroment: str = "development"

    # 보안 관련
    secret_key: str = "Bo0kb1ar11oGCh@7Ju04!28$7924L5wi2"

    # 데이터베이스 입력
    database_url: str = "sqlite:///data/blog.db"

    # 서버 설정
    host: str = "0.0.0.0"
    port: int = 8000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# 전역 설정 인스턴스
settings = Settings()