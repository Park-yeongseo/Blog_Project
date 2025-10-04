from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import User as UserModel
from app.schemas import UserCreate, UserResponse
from app.security import PasswordHasher, get_current_user, create_access_token


router = APIRouter(prefix="/auth", tags=["Auth"])# 인증 엔드포인트

# 회원가입
@router.post("/auth/signup", response_model=UserResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # 이메일 중복 확인
    if db.query(UserModel).filter(UserModel.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")
    
    # 사용자 이름 중복 확인
    if db.query(UserModel).filter(UserModel.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="이미 사용 중인 사용자 이름입니다.")
    
    # 비밀번호 해시
    password_hash = PasswordHasher.hash_password_combined(user_data.password)
    
    # 새로운 사용자 생성
    new_user = UserModel(
        username=user_data.username,
        email=user_data.email,
        password_hash=password_hash,
        bio=user_data.bio or "사용자가 소개를 입력하지 않았습니다.",
        created_at=datetime.now()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


# 로그인 (JWT 발급)
@router.post("/auth/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):

    # 사용자 조회
    user = db.query(UserModel).filter(UserModel.email== email).first()
    if not user:
        raise HTTPException(status_code=401, detail="존재하지 않는 이메일입니다.")

    # 비밀번호 검증
    if not PasswordHasher.verify_password_combined(password, user.password_hash):
        raise HTTPException(status_code=401, detail="비밀번호가 일치하지 않습니다.")
    
    # JWT 토큰 생성
    token = create_access_token(data={"sub": str(user.id)})

    # 응답 반환
    return {"access_token": token, "token_type": "bearer"}


# 로그아웃
@router.post("/auth/logout")
def logout(user_id: int = Depends(get_current_user)):
    return{"message": "로그아웃 되었습니다."}


# 회원 탈퇴
@router.delete("/auth/withdraw")
def withdraw(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 사용자 조회
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    # 사용자 삭제
    db.delete(user)
    db.commit()

    return {"message": "회원탈퇴가 완료되었습니다."}