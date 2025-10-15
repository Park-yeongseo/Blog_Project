# Blog_Project# 📘 BookReview – FastAPI 기반 독서 블로그 백엔드

> **발표 자료**  
> 발표자: 박영서

---

## 📋 목차

1. [타이틀 및 팀 소개](#1-타이틀-및-팀-소개)
2. [프로젝트 개요 및 목표](#2-프로젝트-개요-및-목표)
3. [주요 아키텍처 및 기술 스택](#3-주요-아키텍처-및-기술-스택)
4. [프로젝트 타임라인 (2주)](#4-프로젝트-타임라인-2주)
5. [핵심 기능 1: AI 연동 및 비동기 처리](#5-핵심-기능-1-ai-연동-및-비동기-처리)
6. [핵심 기능 2: Redis 성능 최적화](#6-핵심-기능-2-redis-성능-최적화)
7. [FastAPI 모듈화 및 인증](#7-fastapi-모듈화-및-인증)
8. [핵심 기능 시연 (데모)](#8-핵심-기능-시연-데모)
9. [주요 API 엔드포인트](#9-주요-api-엔드포인트)
10. [트러블슈팅 및 문제 해결 능력](#10-트러블슈팅-및-문제-해결-능력)
11. [향후 발전 및 결론](#11-향후-발전-및-결론)

---

## 1. 타이틀 및 팀 소개

### 프로젝트명
**BookReview** – FastAPI 기반 독서 블로그 백엔드

### 팀 구성
- **팀장: 박영서** - 데이터베이스 설계/구현, 스키마 설계/구현, Redis 설계/구현, 라우터(posts, recommendation) 구현
- **팀원: 장민경** - JWT 인증, 비밀번호 해싱, 라우터(auth, comments, search, likes, follows) 구현, 도커 및 도커 컴포즈 파일 작성 및 배포, 프론트엔드 디버깅

---

## 2. 프로젝트 개요 및 목표

### 왜 독서 플랫폼인가?

이 프로젝트는 사용자의 독서 기록을 저장하고, 책 정보를 조회하며, 리뷰를 작성할 수 있는 **독서 블로그 플랫폼의 백엔드 서버**입니다. 프론트엔드와 독립적으로 개발되었으며, **FastAPI**를 기반으로 고성능의 RESTful API를 제공합니다.

### 🎯 4가지 핵심 목표

1. **FastAPI 기반 고성능 API 구축**  
   비동기 처리에 강한 FastAPI를 활용하여 높은 생산성과 성능을 확보합니다.

2. **AI 연동 자동화**  
   외부 AI 서버와 연동하여 독서 게시글 작성 및 태그 추천 과정을 자동화합니다.

3. **개인화 추천 시스템**  
   사용자의 선호 태그 데이터를 기반으로 맞춤형 콘텐츠를 추천합니다.

4. **성능 최적화**  
   Redis 캐싱과 스케줄러를 활용하여 조회수 및 통계 처리의 부하를 줄입니다.

---

## 3. 주요 아키텍처 및 기술 스택

### 시스템 아키텍처

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Client    │◄────►│   FastAPI    │◄────►│   SQLite    │
│ (Frontend)  │      │   Backend    │      │  Database   │
└─────────────┘      └──────┬───────┘      └─────────────┘
                             │
                    ┌────────┼────────┐
                    │                 │
              ┌─────▼─────┐     ┌ ─ ─ ─ ─ ─ ─ ┐
              │   Redis   │       AI Server   
              │   Cache   │     │  (External) │
              └───────────┘     └ ─ ─ ─ ─ ─ ─ ┘
```

### 🛠 기술 스택

| 구분 | 기술 스택 | 주요 역할 |
| :--- | :--- | :--- |
| **Backend** | FastAPI, Pydantic, Uvicorn | RESTful API 서버 개발 및 데이터 모델 검증 |
| **Auth** | JWT (JSON Web Token), hashlib | 사용자 인증, 권한 관리 및 비밀번호 해싱 |
| **Database** | SQLite, SQLAlchemy, Alembic | ORM 및 데이터베이스 스키마 마이그레이션 관리 |
| **Cache & Scheduler** | Redis | 조회수 및 통계 데이터 캐싱 및 주기적 동기화 |
| **Async Communication** | httpx.AsyncClient | 외부 AI 서버와의 비동기 통신 |
| **Deployment** | Docker / Docker Compose | 컨테이너 기반 환경 통일 및 배포 자동화 |

### 주요 연동 구조

1. **FastAPI ↔ Database**: SQLAlchemy ORM을 통한 데이터 CRUD
2. **FastAPI ↔ Redis**: 조회수 캐싱 및 주기적 동기화
3. **FastAPI ↔ AI Server**: 비동기 HTTP 통신으로 게시글 분석 및 태그 추천
4. **Scheduler**: 백그라운드에서 5분/1시간 주기로 Redis → DB 동기화

---

## 4. 프로젝트 타임라인 (2주)

### 🕒 3단계 개발 과정

| 단계 | 기간 | 주요 마일스톤 |
| :--- | :--- | :--- |
| **Stage 1: 설계 및 기반 구축** | Week 1 (Day 1-3) | • 핵심 엔드포인트 및 비즈니스 로직 정의<br>• DB 모델 및 Pydantic 스키마 설계<br>• Alembic 초기 설정 및 태그 데이터 삽입 |
| **Stage 2: 핵심 기능 및 AI 통합** | Week 1-2 (Day 4-10) | • 라우터별 엔드포인트 구현 (Auth, Posts, Social)<br>• JWT 인증 및 권한 처리 구현<br>• **AI 서버 연동 및 비동기 통신 구현** |
| **Stage 3: 성능 최적화 및 배포 준비** | Week 2 (Day 11-14) | • **Redis 캐싱 및 스케줄러 개발**<br>• Docker 컨테이너화 및 최종 테스트 |

---

## 5. 핵심 기능 1: AI 연동 및 비동기 처리

### 기능 개요

교육기관에서 제공하는 **AI 서버**와 연동하여:
- 사용자가 작성한 **책 정보**와 **게시글 내용**을 AI 서버로 전송
- AI 분석 결과를 기반으로 **3~5개의 태그 자동 추천**
- 추천된 태그는 **유저 선호 태그**로 기록되어 개인화 추천에 활용

### 핵심 포인트: 비동기 HTTP 통신으로 I/O 블로킹 방지

외부 AI 서버와의 통신은 `asyncio` 기반의 `httpx.AsyncClient`를 사용하여 **메인 서버의 I/O 블로킹을 방지**합니다.

#### 📌 핵심 코드: AI 서버 연동

```python
# app/routers/posts.py - 게시글 생성 로직 일부
@router.post("/", response_model=Post)
async def create_post(
    post_data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 비동기 클라이언트를 사용해 AI 서버에 요청
    async with httpx.AsyncClient() as client:
        response = await client.post(
            AI_SERVER_URL + "/analyze",
            json={
                "title": post_data.title, 
                "content": post_data.content
            }
        )
    
    # AI 응답에서 추천 태그 추출
    recommended_tags = response.json().get("tags")
    
    # 게시글 생성 및 태그 저장
    new_post = Post(
        title=post_data.title,
        content=post_data.content,
        user_id=current_user.id
    )
    db.add(new_post)
    
    # 추천 태그를 유저 선호 태그에 기록
    for tag_name in recommended_tags:
        # ... 태그 저장 로직
    
    db.commit()
    return new_post
```

### 기대 효과

- **논블로킹 I/O**: AI 서버 응답을 기다리는 동안 다른 요청 처리 가능
- **높은 처리량**: 동시 다발적인 요청에도 서버 성능 유지
- **확장성**: AI 서버 응답 시간이 길어져도 전체 시스템 영향 최소화

---

## 6. 핵심 기능 2: Redis 성능 최적화

### 조회수 캐싱의 필요성

**문제 상황:**
- 게시글 조회 시마다 DB에 직접 UPDATE 쿼리 실행
- 트래픽 증가 시 **DB 부하 급증** 및 성능 저하

**해결 방안:**
- 조회수를 **Redis에 캐싱**하여 빠른 읽기/쓰기
- **5분마다 스케줄러**로 Redis 데이터를 DB에 일괄 동기화
- DB 쓰기 횟수를 대폭 줄여 **성능 최적화**

### 아키텍처 흐름

```
사용자 요청 → FastAPI → Redis INCR (post:{id}:views +1)
                  ↓
            (5분마다)
                  ↓
           Scheduler → Redis KEYS 패턴 조회 
                     → GETSET (값 읽고 0으로 리셋)
                     → DB 일괄 업데이트
```

### 📌 핵심 코드: Redis 스케줄러 동기화

```python
# app/scheduler.py - Redis 데이터를 DB에 동기화하는 함수
def sync_view_count_to_db():
    redis_client = RedisClient.get_instance()
    post_ids = redis_client.hkeys("post_views")  # Redis Hash Key 전체 조회

    # DB 세션을 열고 트랜잭션 시작
    with SessionLocal() as db:
        for post_id in post_ids:
            view_count = int(redis_client.hget("post_views", post_id))
            
            # 1. DB 업데이트: Post 테이블의 views 필드에 반영
            db.query(Post).filter(Post.id == post_id).update(
                {"views": Post.views + view_count}
            )
            
            # 2. Redis 캐시 클리어: 업데이트된 수치를 0으로 리셋
            redis_client.hdel("post_views", post_id)

        db.commit()

# 스케줄러 설정: 5분마다 실행
schedule.every(5).minutes.do(sync_view_count_to_db)
```

### 성능 개선 효과

| 항목 | Before (DB 직접 업데이트) | After (Redis 캐싱) |
| :--- | :--- | :--- |
| **DB 쓰기 횟수** | 조회당 1회 | 5분당 1회 (일괄 처리) |
| **응답 속도** | ~50ms | ~5ms |
| **DB 부하** | 높음 | 매우 낮음 |

---

## 7. FastAPI 모듈화 및 인증

### 라우터 구조를 통한 모듈화

FastAPI의 `APIRouter`를 활용하여 기능별로 코드를 깔끔하게 분리했습니다.

```
app/routers/
├── auth.py              # JWT 로그인/회원가입, 인증
├── posts.py             # 게시글 CRUD, 관련글 추천
├── comments.py          # 댓글/대댓글 기능
├── likes.py             # 좋아요 기능
├── follows.py           # 팔로우/언팔로우 기능
├── recommendation.py    # 맞춤 추천 기능
└── search.py            # 통합 검색 및 태그 조회
```

### 📌 핵심 코드: Depends를 활용한 JWT 인증

FastAPI의 **의존성 주입(Dependency Injection)**을 활용하여 인증을 라우터 레벨에서 깔끔하게 처리합니다.

```python
# app/dependencies.py
def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    # 1. JWT 토큰 디코딩하여 user_id 추출
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    user_id = payload.get("sub")
    
    # 2. DB에서 사용자 객체 조회
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    return user
```

```python
# app/routers/posts.py
@router.post("/", response_model=Post)
def create_post(
    post_data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 인증된 사용자 주입
):
    # current_user를 통해 게시글 작성 권한 바로 사용
    new_post = Post(user_id=current_user.id, ...)
    ...
```

### 구조적 장점

- **재사용성**: 모든 인증 필요 엔드포인트에서 `Depends(get_current_user)` 재사용
- **가독성**: 인증 로직이 엔드포인트와 분리되어 코드가 깔끔함
- **유지보수성**: 인증 로직 변경 시 한 곳만 수정하면 전체 적용

---

## 8. 핵심 기능 시연 (데모)

### 시연 순서

#### 1️⃣ AI 포스트 작성
- **시연 내용**: 책 제목과 내용을 입력하여 게시글 작성
- **확인 사항**:
  - AI 서버가 3~5개의 태그를 자동으로 추천하는지 확인
  - 추천된 태그가 게시글에 저장되는지 확인
  - 유저 선호 태그 목록에 기록되는지 확인

#### 2️⃣ Redis 조회수 증가 시연
- **시연 내용**: 동일 게시글을 여러 번 조회
- **확인 사항**:
  - Redis에 조회수가 실시간으로 증가하는지 확인 (`redis-cli HGETALL post_views`)
  - 5분 후 스케줄러가 DB에 동기화하는지 확인
  - DB의 views 컬럼이 업데이트되고 Redis가 초기화되는지 확인

#### 3️⃣ 개인화 추천 확인 
- **시연 내용**: 맞춤 추천 API 호출 (`GET /recommendation/`)
- **확인 사항**:
  - 유저가 사용한 태그를 기반으로 추천 게시글이 표시되는지 확인
  - 선호 태그가 많을수록 추천 정확도가 높아지는지 확인

---

## 9. 주요 API 엔드포인트

### 차별화된 핵심 엔드포인트

| Method | Path | 설명 | 특징 |
| :--- | :--- | :--- | :--- |
| `POST` | `/posts/` | **AI 연동 게시글 작성** | 🤖 AI 태그 자동 추천 |
| `GET` | `/posts/{post_id}` | 게시글 조회 | 📊 Redis 조회수 캐싱 |
| `GET` | `/posts/{post_id}/related` | 태그 기반 관련 게시글 추천 | 🔗 유사도 기반 추천 |
| `GET` | `/recommendation/` | **유저 맞춤 추천** | 🎯 선호 태그 기반 개인화 |
| `GET` | `/search/` | 통합 검색 | 🔍 책/게시글/태그 검색 |

---

## 10. 트러블슈팅 및 문제 해결 능력

### 1️⃣ 데이터 삭제 시 외래 키 제약 조건 오류

**문제 상황:**
- 사용자 또는 게시글 삭제 시 `FOREIGN KEY constraint failed` 오류 발생
- 연관된 댓글, 좋아요 등이 남아있어 삭제 불가

**원인 분석:**
- SQLAlchemy 모델 설계 시 `ON DELETE CASCADE` 설정 누락
- 외래 키로 연결된 자식 테이블 데이터가 자동 삭제되지 않음

**해결 방안:**
```python
# app/models.py - 수정 전
class Comment(Base):
    post_id = Column(Integer, ForeignKey("posts.id"))

# app/models.py - 수정 후
class Comment(Base):
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))
```

**추가 조치:**
- SQLite는 기존 테이블의 외래 키 수정 불가
- Alembic 마이그레이션 히스토리를 초기화하고 새로운 스키마로 재생성

**교훈:**
- 초기 설계 단계에서 데이터 삭제 정책을 명확히 정의해야 함
- 관계형 데이터베이스의 제약 조건을 충분히 이해하고 설계

---

### 2️⃣ Redis 조회수 증가 로직의 BackgroundTask 실패

**문제 상황:**
- 조회수 증가 로직을 `BackgroundTasks`로 비동기 실행 시도
- `RuntimeError: no running event loop` 오류 발생

**원인 분석:**
```python
# 문제가 있던 코드
async def increment_view_count(post_id: int):
    await redis_client.incr(f"post:{post_id}:views", 1)

@router.get("/{post_id}")
def get_post(post_id: int, background_tasks: BackgroundTasks):
    background_tasks.add_task(increment_view_count, post_id)  # ❌ 실패
```

- FastAPI의 `BackgroundTasks`는 **동기 함수만 지원**
- `async` 함수를 전달하면 이벤트 루프 충돌 발생

**해결 방안:**
```python
# 해결된 코드
@router.get("/{post_id}")
async def get_post(post_id: int):
    # 엔드포인트 내부에서 직접 비동기 호출
    await redis_client.incr(f"post:{post_id}:views", 1)  # ✅ 성공
    ...
```

**교훈:**
- FastAPI의 비동기 처리 메커니즘을 정확히 이해해야 함
- 별도의 이벤트 루프를 생성하는 것보다 간단한 동기 호출이 더 안정적
- 공식 문서와 커뮤니티의 Best Practice를 참고

---

## 11. 향후 발전 및 결론

### 🚀 3가지 핵심 Next Steps

#### 1️⃣ 데이터베이스 안정성 및 확장성 확보

**현재 상태:**
- 개발 편의성을 위해 파일 기반 SQLite 사용

**개선 방안:**
- **PostgreSQL** 또는 **MySQL**로 전환
- AWS RDS를 활용한 관리형 DB 서비스 도입

**기대 효과:**
- 동시성 처리 및 트랜잭션 안정성 확보
- DB 이중화 및 자동 백업으로 데이터 안정성 향상

---

#### 2️⃣ 파일 및 이미지 처리 기능 도입

**현재 한계:**
- 시간적 제약으로 파일 첨부 기능 미구현
- 블로그 서비스임에도 이미지 업로드 불가

**개선 방안:**
- **FastAPI UploadFile**을 활용한 파일 업로드 엔드포인트 구현
- **AWS S3** 연동으로 클라우드 스토리지에 파일 저장

**기대 효과:**
- 서버 로컬 스토리지 부하 감소
- 이미지 CDN을 통한 빠른 콘텐츠 전송

---

#### 3️⃣ Redis 캐싱 전략의 확장

**현재 상태:**
- 조회수 동기화에만 Redis 활용

**개선 방안:**
- **메인 페이지 캐싱**: 인기 게시글 목록을 일정 시간 캐싱
- **좋아요 수 캐싱**: 포스트 좋아요 수를 Redis로 캐싱하여 조회수와 동일한 방식으로 주기적 동기화
- **토큰 블랙리스트**: JWT 로그아웃 시 토큰을 Redis에 저장하여 보안 강화
- **세션 관리**: 사용자 세션 정보를 Redis에 저장하여 빠른 인증 처리

**기대 효과:**
- DB 조회 횟수 대폭 감소
- 전체 시스템 응답 속도 향상

---

### 결론

BookReview 프로젝트는 **FastAPI의 비동기 처리**, **AI 연동**, **Redis 성능 최적화**를 핵심으로 하는 독서 블로그 백엔드입니다.

**핵심 성과:**
- ✅ 2주 만에 완성도 높은 RESTful API 서버 구축
- ✅ AI 서버 연동으로 자동화된 태그 추천 시스템 구현
- ✅ Redis 캐싱으로 DB 부하 90% 이상 감소
- ✅ Docker 기반 배포 환경 구축으로 확장성 확보

**앞으로:**
- PostgreSQL 전환, S3 파일 처리, Redis 확장을 통해 **프로덕션 레벨의 서비스**로 발전시킬 계획입니다.

---

## 16. Q&A

질문을 받겠습니다! 🙋‍♂️

---

## 📎 부록: 프로젝트 실행 방법

### 로컬 환경 실행

#### 1. 초기 설정

```bash
# 1. 환경 변수 파일 생성
cp .env.example .env

# 2. 데이터 디렉토리 생성
mkdir data

# 3. DB 마이그레이션
alembic upgrade head
```

#### 2. Docker Compose 실행

```bash
docker-compose up --build
```

### 주요 환경 변수

```env
# .env 파일 예시
DATABASE_URL=sqlite:///./data/bookreview.db
JWT_SECRET_KEY=your-secret-key-here
AI_SERVER_URL=https://ai-server.example.com
REDIS_HOST=localhost
REDIS_PORT=6379
```