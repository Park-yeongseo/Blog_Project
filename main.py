from fastapi import FastAPI, status, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from pydantic import ValidationError
from app.database import create_table
from app.routers.auth import router as auth_router # auth.py의 라우터 연결
from app.routers import comments, posts
from app.routers.follows import router as follow_router
from app.routers.search import router as search_router


app= FastAPI()

@app.exception_handler(ValidationError)
def validation_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error_code": "ValidationError",
            "errors": exc.errors()
        }
    )

# 라우터 연결
app.include_router(auth_router)
app.include_router(follow_router)
app.include_router(search_router)
app.include_router(comments.router)

app.include_router(posts.router)


@app.get('/healthy')
def health_check():
    return {'hello': 'world'}