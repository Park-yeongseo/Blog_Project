import base64
import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError, ExpiredSignatureError
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User as UserModel

# JWT 설정값
SECRET_KEY = settings.jwt_secret
ALGORITHM = settings.jwt_algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes  # 기본값 제거 후 .env에서 주입

# 비밀번호 해싱 클래스
class PasswordHasher:
    @staticmethod
    def hash_password_combined(password: str, salt: bytes = None) -> str:
        salt = salt or os.urandom(16)
        hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
        return base64.b64encode(salt + hashed).decode()

    @staticmethod
    def verify_password_combined(password: str, hashed_combined: str) -> bool:
        decoded = base64.b64decode(hashed_combined.encode())
        salt = decoded[:16]
        stored_hash = decoded[16:]
        new_hash = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
        return new_hash == stored_hash
    

# JWT 토큰 생성
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# JWT 토큰 검증
def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise ValueError("토큰이 만료되었습니다.")
    except JWTError:
        raise ValueError("유효하지 않은 토큰입니다.")

# 인증 의존성 설정
security = HTTPBearer()

# 현재 사용자 정보 추출
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> UserModel:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    # 사용자 조회
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    return user

def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)) ->Optional[UserModel]:
    if credentials:
        token = credentials.credentials
        try:
            payload = decode_access_token(token)
            user_id = int(payload["sub"])
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))

        # 사용자 조회
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        
        return user
    else:
        return None