import logging
from sqlalchemy import update
from sqlalchemy.orm import selectinload
from app.models import Post, User
from app.redis_client import redis_client
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def sync_views_to_db():
    from app.database import SessionLocal

    logger.info("조회수 동기화 시작")

    try:
        keys = await redis_client.redis.keys("post:*:views")
        db = SessionLocal()
        for key in keys:
            post_id = int(key.split(":")[1])
            increment_views = await redis_client.getset(key)

            if increment_views == 0:
                continue

            result = db.execute(
                update(Post)
                .where(Post.id == post_id)
                .values(views=Post.views + increment_views)
            )
            db.commit()
    except Exception as e:
        logger.error(f"조회수 db 동기화 실패: {e}")
    finally:
        db.close()

async def sync_user_totalviews_to_db():
    from app.database import SessionLocal
    logger.info("User total views 동기화 시작")
    try:
        db = SessionLocal()
        users = db.query(User).options(selectinload(User.posts)).all()
        for user in users:
            total_views = sum(post.views for post in user.posts)
            user.total_views = total_views
        db.commit()
    except Exception as e:
        logger.error(f"User total views 동기화 실패:{e}")
    finally:
        db.close()
        
def start_scheduler():
    scheduler.add_job(
        sync_views_to_db,
        trigger=IntervalTrigger(minutes=5),
        id="sync_views",
        name = "Redis to DB 동기화",
        replace_existing=True
    )
    scheduler.add_job(
        sync_user_totalviews_to_db,
        trigger=IntervalTrigger(hours=1),
        id="syncUser_total_veiw",
        name="User total views DB 동기화",
        replace_existing=True
    )
    scheduler.start()
    logger.info("스케줄러 작업실행 \n 레디스 조회수 동기화: 5분간격 \n 유저 종합 조회수 동기화 : 60분 간격")
    
def stop_scheduler():
    scheduler.shutdown()
    logger.info("스케줄러 종료")