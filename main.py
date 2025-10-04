from fastapi import FastAPI, status, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from pydantic import ValidationError
from app.database import create_table
from app.auth import router as auth_router # auth.py의 라우터 연결


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

# HTTPException 커스터마이징 핸들러
@app.exception_handler(HTTPException)
def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": "HTTPException",
            "message": exc.detail,
            "status": exc.status_code,
            "path": str(request.url)
        }
    )

# DB 테이블 생성
create_table()

# 라우터 연결
app.include_router(auth_router)