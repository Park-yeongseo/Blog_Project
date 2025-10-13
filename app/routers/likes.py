from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, insert, update, delete
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import Post
from app.models import Like, Post as PostModel, User
from app.security import get_current_user


router = APIRouter(prefix="/likes", tags=["Likes"])


@router.get("/user", response_model=List[Post])
async def user_likes(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    posts = (
        db.query(PostModel)
        .join(Like, Like.post_id == PostModel.id)
        .filter(Like.user_id == current_user.id)
        .order_by(Like.created_at.desc())
        .offset(limit * (page - 1))
        .limit(limit)
        .all()
    )

    return posts


@router.get("/{post_id}/likes")
async def post_likes(post_id: int, db: Session = Depends(get_db)):
    
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="존재하지 않는 게시물 입니다.")
    

    users = [user.user_id for user in post.likes]
    like_count = len(users)

    return {"like_count": like_count, "users": users}


@router.post("/{post_id}/like")
async def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="존재하지 않는 게시글 입니다."
        )

    post_likes = post.likes
    is_like = current_user.id in [user.user_id for user in post_likes]

    try:
        if is_like:
            like_count = len(post_likes) - 1
            post.like_count = like_count
            db.execute(
                delete(Like).where(
                    and_(Like.post_id == post.id, Like.user_id == current_user.id)
                )
            )
            liked = False
        else:
            like_count = len(post_likes) + 1
            post.like_count = like_count
            new_like = Like(user_id=current_user.id, post_id=post.id)
            db.add(new_like)
            liked = True
        db.commit()

        return {"liked": liked, "like_count": like_count}

    except:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="좋아요가 처리되지 않았습니다.",
        )
