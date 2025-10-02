# config.py
import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 기본 설정
    app_name: str = "FastAPI App"
    debug: bool = False
    enviroment: str = "development"
    
    #open_ai URL
    openai_url : str = ''

    # 데이터베이스 입력
    database_url: str = ''
    
    #jwt
    jwt_secret : str = ''
    jwt_algorithm : str = ''
    access_token_expire_minute : str = ''

    # 서버 설정
    host: str = "0.0.0.0"
    port: int = 8000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# 전역 설정 인스턴스
settings = Settings()