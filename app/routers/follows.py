from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models import User, Follow
from app.security import get_current_user
from app.database import get_db


router = APIRouter(prefix="/users", tags=["Follows"])

# 팔로우
@router.post("/{user_id}/follow")
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    # 자기 자신 팔로우 방지
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="자기 자신은 팔로우할 수 없습니다.")
    
    # 중복 팔로우 방지
    existing_follow = db.query(Follow).filter_by(
        follower_id=current_user.id,
        following_id=user_id
    ).first()
    if existing_follow:
        raise HTTPException(status_code=400, detail="이미 팔로우한 사용자입니다.")

    new_follow = Follow(follower_id=current_user.id, following_id=user_id)
    db.add(new_follow)
    db.commit()
    return {"message": "팔로우 완료"}


# 언팔로우
@router.delete("/{user_id}/unfollow")
def unfollow_user(
        user_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
): 
    
    follow_record = db.query(Follow).filter_by(
        follower_id=current_user.id,
        following_id=user_id
    ).first()
    
    if not follow_record:
        raise HTTPException(status_code=404, detail="팔로우 중인 유저가 아닙니다.")

    db.delete(follow_record)
    db.commit()
    return {"message": "언팔로우 완료"}


# 팔로워 목록
@router.get("/{user_id}/followers")
def get_followers(
    user_id: int,
    db: Session = Depends(get_db)
):
    
    followers = db.query(User).join(
        Follow, Follow.follower_id == User.id).filter(
            Follow.following_id == user_id
            ).all()
    
    return {
        "followers": [
            {"id": user.id, "username": user.username}
            for user in followers
        ]
    }

# 팔로잉 목록
@router.get("/{user_id}/following")
def get_following(
    user_id: int,
    db: Session = Depends(get_db)
):
    following = db.query(User).join(
        Follow, Follow.following_id == User.id
    ).filter(
        Follow.follower_id == user_id
    ).all()

    return {
        "follwing": [
            {"id": user.id, "username": user.username}
            for user in following
        ]
    }


# 팔로우 상태 확인
@router.get("/{user_id}/follow-status")
def check_follow_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    follow_record = db.query(Follow).filter_by(
        follower_id=current_user.id,
        following_id=user_id
    ).first()

    return {"is_following": bool(follow_record)}