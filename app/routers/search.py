from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Post, Book, Tag, User
from app.schemas import SearchResult
from app.security import get_current_user_optional


router = APIRouter(prefix="/search", tags=["Search"])

@router.get("/", response_model=list[SearchResult])
def search(
    q: str = "",
    tags: list[str] = Query(default=[]), # 최대 3개 선택
    page: int = 1,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(Post).join(Book).outerjoin(Post.tags)

    # 로그인한 경우 자기 게시글 제외
    if current_user:
        query = query.filter(Post.user_id != current_user.id)

    # 통합 검색: q가 있으면 모든 곳에서 검색
    if q:
        search_conditions = [
            Post.title.ilike(f"%{q}%"),      # 게시글 제목
            Post.content.ilike(f"%{q}%"),    # 게시글 내용
            Book.title.ilike(f"%{q}%"),      # 책 제목
            Book.isbn.ilike(f"%{q}%"),       # ISBN (부분 일치)
            Tag.name.ilike(f"%{q}%")         # 태그 이름
        ]
        query = query.filter(or_(*search_conditions))
        
    # 태그 필터 (추가 필터링)
    if tags:
        query = query.filter(Tag.name.in_(tags))

    # 최신순 정렬
    query = query.order_by(Post.created_at.desc())

    # 페이지네이션
    page_size = 10
    results = query.offset(
        (page - 1) * page_size).limit(page_size).all()
    
    return [
        SearchResult(
            post_id=post.id,
            title=post.title,
            book_title=post.book.title,
            tags=[tag.name for tag in post.tags],
            isbn=post.book.isbn,
            created_at=post.created_at
        )
        for post in results
    ]


@router.get("/tags")
async def get_all_tags(db: Session = Depends(get_db)):
    
    tags = db.query(Tag).all()
    return [tag.name for tag in tags]