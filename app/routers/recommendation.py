from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import and_, func
from app.database import get_db
from app.models import PostTag, User, UserTagPreference
from app.models import Post as PostModel
from app.schemas import Post
from app.security import get_current_user, get_current_user_optional
from sqlalchemy.orm import Session

router = APIRouter(prefix="/recommendation", tags=["recommendation"])

@router.get("/popular", response_model=List[Post])
async def popular_posts(
    page: int = 1,
    limit: int = 9,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    query = db.query(PostModel)
    if current_user:
        query = query.filter(PostModel.user_id != current_user.id)

    posts = (
        query
        .order_by(PostModel.like_count.desc(), func.random())
        .offset(limit * (page - 1))
        .limit(limit)
        .all()
    )
    return posts

@router.get("/", response_model=List[Post])
async def recommend_post(
    page: int = 1,
    limit: int = 9,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subquery = (
        db.query(
            PostTag.post_id,
            func.sum(UserTagPreference.frequency).label("frequency_score"),
            func.count(PostTag.tag_id).label("match_score"),
        )
        .join(UserTagPreference, PostTag.tag_id == UserTagPreference.tag_id)
        .filter(UserTagPreference.user_id == current_user.id)
        .group_by(PostTag.post_id)
        .subquery()
    )
    posts = (
        db.query(PostModel)
        .join(subquery, PostModel.id == subquery.c.post_id)
        .filter(PostModel.user_id != current_user.id)
        .order_by(
            (subquery.c.frequency_score * subquery.c.match_score).desc(),
            func.random(),
        )
        .offset(limit * (page - 1))
        .limit(limit)
        .all()
    )

    return posts




