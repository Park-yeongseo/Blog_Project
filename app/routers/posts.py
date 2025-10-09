import json
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
import httpx
from sqlalchemy import and_, func, insert, update
from app.database import get_db
from app.models import Book, Post as PostModel, PostTag, Tag, User, UserTagPreference
from app.schemas import Post, PostCreate, PostUpdate
from app.schemas import UserResponse
from app.security import get_current_user, get_current_user_optional
from sqlalchemy.orm import Session
from app.config import settings
import logging


router = APIRouter(prefix="/posts", tags=["posts"])

logger = logging.getLogger()


def increment_view(post_id: int):
    """
    조회수를 증가시키는 로직
    """
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        db.execute(
            update(PostModel)
            .where(PostModel.id == post_id)
            .values(views=PostModel.views + 1)
        )
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to increment view count: {e}")
    finally:
        db.close()


async def make_tags(
    db: Session, book_title: str, isbn: str, content: str
) -> List[dict]:
    """
    ai로 태그를 생성하는 로직
    """
    tags = db.query(Tag).all()
    tag_list = [{"tag_id": tag.id, "tag_name": tag.name} for tag in tags]
    message = []

    system_content = f"""
    당신은 독서 관련 게시글의 태그 생성 ai 입니다.
    -책 제목
    -책 isbn 번호
    -게시글 내용
    
    역할 : 위 내용들을 기반한 태그를 아래의 태그 목록 내에서 겹치지 않게 최소 3개 최대 5개 출력하세요
    -태그 목록 {tag_list}
    
    응답 형식 : 반드시 다음 json 형식으로만 응답하세요:
    {"response": [{"tag_id": "태그 아이디1", "tag_name": "태그 이름1"},{"tag_id": "태그 아이디2", "tag_name": "태그 이름2"},{"tag_id": "태그 아이디3", "tag_name": "태그 이름3"}....]}
    """
    message.append({"role": "system", "content": system_content})
    message.append(
        {
            "role": "user",
            "content": f"책 제목 : {book_title}, 책 isbn 번호 : {isbn}, 게시글 내용 : {content}",
        }
    )

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                settings.openai_url,
                timeout=60.0,
                json=message,
            )
            if resp.status_code != 200:
                resp.raise_for_status()
            response_data = resp.json()
            return_message = response_data["choices"][0]["message"]["content"]

    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="태그 생성에 실패하였습니다.",
        )

    try:
        parsed_response = json.loads(return_message)

        if "response" not in parsed_response:
            raise ValueError("응답 형식이 잘못되었습니다.")

        tags = parsed_response["response"]

        if not isinstance(tags, list) or len(tags) < 3 or len(tags) > 5:
            raise ValueError("태그 갯수가 올바르지 않습니다.")

        for tag in tags:
            if "tag_id" not in tag or "tag_name" not in tag:
                raise ValueError("태그 형식이 올바르지 않습니다.")
        return tags

    except (ValueError, json.JSONDecodeError, KeyError) as e:
        logger.error(f"AI 응답 검증 실패 : {e}, 응답 내용 :{return_message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI 응답 검증에 실패했습니다.",
        )


@router.get("/{post_id}", response_model=Post)
async def get_post_detail(
    post_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)
):
    post = db.query(PostModel).filter(PostModel.id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="존재하지 않는 게시글 입니다."
        )
    if not current_user or post.user_id != current_user.id:
        background_tasks.add_task(increment_view, post_id)

    return post


@router.get("/{post_id}/related", response_model=List[Post])
async def get_any_posts(post_id: int, limit: int = 5, db: Session = Depends(get_db)):
    """
    해당 게시글 관련 게시글을 불러오는 엔드 포인트 입니다.
    """
    post = db.query(PostModel).filter(PostModel.id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="존재하지 않는 게시글 입니다."
        )
    post_tags = [tag.id for tag in post.tags]

    related = (
        db.query(PostModel, func.count(PostTag.tag_id))
        .join(PostTag)
        .filter(PostTag.tag_id.in_(post_tags), PostModel.id != post.id)
        .group_by(PostModel.id)
        .order_by(func.count(PostTag.tag_id).desc())
        .limit(10)
        .all()
    )
    related_data = [data for data, count in related]
    related_posts = random.sample(related_data, min(limit, len(related_data)))
    return related_posts


@router.get("/users/{user_id}", response_model=List[Post])
async def get_post_by_user(user_id: int, db: Session = Depends(get_db)):
    posts = db.query(PostModel).filter(PostModel.user_id == user_id).all()
    return posts


@router.post("/", response_model=Post)
async def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        new_post = PostModel(
            user_id=current_user.id,
            title=data.title,
            content=data.content,
            isbn=data.isbn,
        )
        db.add(new_post)
        if not db.query(Book).filter(Book.isbn == data.isbn).first():
            new_book = Book(
                isbn=data.isbn, title=data.book_title, author=data.book_author
            )
            db.add(new_book)

        db.flush()
        # tags = await make_tags(db, data.book_title, data.isbn, data.content)

        # 🔧 임시: 수동으로 태그 지정 (Tag 테이블에 있는 tag_id 사용)
        tags = [
            {"tag_id": 1, "tag_name": "테스트태그1"},
            {"tag_id": 2, "tag_name": "테스트태그2"},
            {"tag_id": 3, "tag_name": "테스트태그3"}
        ]

        new_posttag = [
            PostTag(post_id=new_post.id, tag_id=tag["tag_id"]) for tag in tags
        ]

        db.add_all(new_posttag)

        for tag in new_posttag:
            if (
                db.query(UserTagPreference)
                .filter(
                    and_(
                        UserTagPreference.user_id == current_user.id,
                        UserTagPreference.tag_id == tag.tag_id,
                    )
                )
                .first()
            ):
                db.execute(
                    update(UserTagPreference)
                    .where(
                        and_(
                            UserTagPreference.user_id == current_user.id,
                            UserTagPreference.tag_id == tag.tag_id,
                        )
                    )
                    .values(frequency=UserTagPreference.frequency + 1)
                )
            else:
                new_usertag = UserTagPreference(
                    user_id=current_user.id, tag_id=tag.tag_id
                )
                db.add(new_usertag)
        db.commit()
        db.refresh(new_post)
        return new_post
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="게시글 작성에 실패했습니다.",
        )


@router.put("/{post_id}", response_model=Post)
async def update_post(
    post_id: int,
    updated_post: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="존재하지 않는 게시글 입니다."
        )

    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="잘못된 접근입니다."
        )
    if updated_post.title:
        post.title = updated_post.title
    if updated_post.content:
        post.content = updated_post.content
    db.commit()
    db.refresh(post)
    return post


@router.delete("/{post_id}")
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="존재하지 않는 게시글 입니다."
        )

    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="잘못된 접근입니다."
        )

    db.delete(post)
    db.commit()
    return
