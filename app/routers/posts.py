from fastapi import APIRouter, Depends
from app.database import get_db
from app.models import Post
from app.schemas import UserResponse
from app.security import get_current_user
from sqlalchemy.orm import Session


router = APIRouter(prefix="posts", tags=["posts"])

@router.get('/{post_id}', response_model=Post)
async def get_post_detail(post_id : int, db: Session = Depends(get_db)):
    