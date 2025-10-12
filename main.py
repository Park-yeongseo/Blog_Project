from typing import Optional
from fastapi import Depends, FastAPI, status, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from pydantic import ValidationError
from app.database import create_table, get_db
from app.models import User
from app.routers.auth import router as auth_router # auth.py의 라우터 연결
from app.routers import comments, posts, recommendation, likes
from app.routers.follows import router as follow_router
from app.routers.search import router as search_router
from app.schemas import UserResponse
from sqlalchemy.orm import Session

from app.security import get_current_user_optional


app= FastAPI()

@app.exception_handler(ValidationError)
def validation_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error_code": "ValidationError",
            "errors": exc.errors()
        }
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

@app.get('/user/{user_id}', response_model = UserResponse)
async def user_info(user_id: int, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: 
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다.")
    
    is_current_user = current_user and (current_user.id ==user.id)
        
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email if is_current_user else None,
        "bio": user.bio,
        "total_views": user.total_views,
        "created_at": user.created_at
    }