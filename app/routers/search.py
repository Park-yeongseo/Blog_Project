from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Post, Book, Tag
from app.schemas import SearchResult


router = APIRouter(prefix="/search", tags=["Search"])

@router.get("/", response_model=list[SearchResult])
def search(
    q: str = "",
    tags: list[str] = Query(default=[]), # 최대 3개 선택
    page: int = 1,
    db: Session = Depends(get_db)
):
    query = db.query(Post).join(Book).outerjoin(Post.tags)

    # 포스트 제목 또는 책 제목 like 검색
    if q:
        query = query.filter(
            or_(
                Post.title.ilike(f"%{q}%"),
                Book.title.ilike(f"%{q}%")
            )
        )

    # 태그 검색(최대 3개)
    if tags:
        query = query.filter(Tag.name.in_(tags))

    # ISBN 정확히 일치
    if q.isdigit() and len(q) in [10, 13]:
        query = query.filter(Book.isbn == q)

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