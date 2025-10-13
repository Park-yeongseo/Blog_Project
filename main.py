from typing import Optional
from fastapi import Depends, FastAPI, status, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from pydantic import ValidationError
from sqlalchemy import update
from app.database import create_table, get_db
from app.models import User
from app.routers.auth import router as auth_router  # auth.py의 라우터 연결
from app.routers import comments, posts, recommendation, likes
from app.routers.follows import router as follow_router
from app.routers.search import router as search_router
from app.schemas import UserInfoUpdate, UserPasswordUpdate, UserResponse
from sqlalchemy.orm import Session

from app.security import PasswordHasher, get_current_user, get_current_user_optional


app = FastAPI()


@app.exception_handler(ValidationError)
def validation_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error_code": "ValidationError", "errors": exc.errors()},
    )


# 라우터 연결
app.include_router(auth_router)
app.include_router(follow_router)
app.include_router(search_router)
app.include_router(comments.router)
app.include_router(recommendation.router)
app.include_router(posts.router)
app.include_router(likes.router)

# @app.get('/healthy')
# def health_check():
#     return {'hello': 'world'}


@app.get("/user/{user_id}", response_model=UserResponse)
async def user_info(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다."
        )

    is_current_user = current_user and (current_user.id == user.id)

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email if is_current_user else None,
        "bio": user.bio,
        "total_views": user.total_views,
        "created_at": user.created_at,
    }


@app.put("/password")
async def update_password(
    data: UserPasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not PasswordHasher.verify_password_combined(
        data.password, current_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호가 일치하지 않습니다.",
        )

    if data.new_password != data.new_password_test:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2차 비밀번호가 일치하지 않습니다.",
        )

    if PasswordHasher.verify_password_combined(
        data.new_password, current_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이전 비밀번호와 다른 비밀번호를 사용해 주세요",
        )

    hash_password = PasswordHasher.hash_password_combined(data.new_password)

    current_user.password_hash = hash_password
    db.commit()
    return {"message": "비밀번호를 변경했습니다."}


@app.put("/userinfo", response_model=UserResponse)
async def update_user_info(
    data: UserInfoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if data.username and data.username != current_user.username:
            is_username = db.query(User).filter(User.username == data.username).first()
            if is_username:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="이미 사용중인 닉네임 입니다.",
                )
            current_user.username = data.username

        if data.bio != current_user.bio:
            current_user.bio = data.bio if data.bio is not None else "사용자가 소개를 입력하지 않았습니다."
        db.commit()
        db.refresh(current_user)
        return current_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="정보 변경에 실패 했습니다.",
        )
