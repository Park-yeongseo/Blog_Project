from typing import Optional
import redis.asyncio as redis
import logging

logger = logging.getLogger(__name__)

class RedisManager:
    def __init__(self):
        self.redis = None

    async def connect(self):
        try:
            self.redis = await redis.from_url(
                "redis://localhost:6379", encoding="utf-8", decode_responses=True
            )
            logger.info("Redis 연결 성공")
        except Exception as e:
            logger.error(f"Redis connect 오류: {e}")    
                
    async def disconnect(self):
        try: 
            if self.redis:  
                await self.redis.close()
        except Exception as e:
            logger.error(f'Redis disconnect 오류 : {e}')
            
            
    async def get(self, key:str):
        try:
            return await self.redis.get(key)
        except Exception as e:
            logger.error(f"Redis get 오류: {e}")
            return None
    
    async def set(self, key: str, value:str, expire: Optional[int] = None):
        try:
            if not expire:
                return await self.redis.set(key,value)
            else :
                return await self.redis.setex(key, expire, value)
        except Exception as e:
            logger.error(f"Redis set 오류: {e}")
            return None
    
    async def delete(self, key: str):
        try: 
            result: int = await self.redis.delete(key)
            return result>0
        except Exception as e:
            logger.error(f"Redis delete 오류 : {e}")
            return False
        
        
    async def exists(self, key: str)->bool:
        try:
            is_exist : int = await self.redis.exists(key)
            return is_exist>0
        except Exception as e:
            logger.error(f"Redis exists 오류: {e}")
            return False
    
    async def incr(self, key: str, amount: int = 1):
        try:
            result : int = await self.redis.incr(key, amount)
            return result
        except Exception as e:
            logger.error(f"Redis increment 오류 :{e}")
            return None
    
    async def getset(self, key: str, value:int = 0):
        try:
            result = await self.redis.getset(key,value)
            if result is None:
                return 0
            return int(result)
        except Exception as e:
            logger.error(f"Redis getset 오류: {e}")
            return 0


redis_client = RedisManager()
        
    
