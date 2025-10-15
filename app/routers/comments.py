from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas import CommentCreateRequest, Comment as CommentSchema
from app.database import get_db
from app.models import Comment as CommentModel, Post, User as UserModel
import app.security

router = APIRouter(prefix="/posts", tags=["Comments"])


# 댓글/대댓글 작성
@router.post("/{post_id}/comments")
def create_comment(
    post_id: int,
    comment_data: CommentCreateRequest,
    user: UserModel = Depends(app.security.get_current_user),
    db: Session = Depends(get_db)
):

# 게시글 존재 확인
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=404, detail="게시글을 찾을 수 없습니다."
        )


    # 대댓글 처리: parent_id가 있으면 depth=1, 없으면 depth=0
    depth = 0
    if comment_data.parent_id:
        parent = db.query(CommentModel).filter(
            CommentModel.id == comment_data.parent_id
        ).first()
        if not parent or parent.depth != 0:
            raise HTTPException(status_code=400, detail="대댓글은 1depth까지만 허용됩니다")
        depth = 1


    # 댓글 객체 생성
    new_comment = CommentModel(
        post_id=post_id,
        user_id=user.id,
        content=comment_data.content,
        parent_id=comment_data.parent_id,
        depth=depth
    )
    db.add(new_comment)
    print(f"댓글 추가 완료: {new_comment.content}")  # 디버그

    db.commit()
    print(f"DB 커밋 완료")  # 디버그
    
    db.refresh(new_comment)
    print(f" 새로고침 완료: ID={new_comment.id}")  # 디버그
    
    return new_comment


# 댓글 목록 조회
@router.get("/{post_id}/comments")
async def get_comments(
    post_id: int,
    db: Session = Depends(get_db)
):
    
    #해당 게시글의 모든 댓글을 시간순으로 조회
    comments = db.query(CommentModel).filter(
        CommentModel.post_id == post_id).order_by(
        CommentModel.created_at
    ).all()
    return comments


# 댓글 수정
@router.put("/comments/{comment_id}")
def update_comment(
    comment_id: int,
    comment_data: CommentSchema,
    user: UserModel = Depends(app.security.get_current_user),
    db: Session = Depends(get_db)
):
    
    # 댓글 존재 여부 확인
    comment = db.query(CommentModel).filter(
        CommentModel.id == comment_id
    ).first()

    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    
    # 작성자만  수정 가능
    if comment.user_id != user.id:
        raise HTTPException(status_code=403, detail="본인의 댓글만 수정할 수 있습니다.")
    
    # 내용 수정
    comment.content = comment_data.content
    db.commit()
    db.refresh(comment)
    return comment    


# 댓글 삭제
@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    user: UserModel = Depends(app.security.get_current_user),
    db: Session = Depends(get_db)
):
    
    # 댓글 존재 여부 확인
    comment = db.query(CommentModel).filter(
        CommentModel.id == comment_id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    
    # 작성자만 삭제 가능
    if comment.user_id != user.id:
        raise HTTPException(status_code=403, detail="본인의 댓글만 삭제할 수 있습니다.")
    
    db.delete(comment)
    db.commit()
    return {"message": "댓글이 삭제되었습니다."}