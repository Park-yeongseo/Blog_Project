FROM python:3.11-slim

WORKDIR /app

# 의존성 파일 설치
COPY requirements.txt .

# Python 패키지 설치
RUN pip install --no-cache-dir -r requirements.txt

# 나머지 파일 복사
COPY . .

# 데이터 디렉토리 생성
RUN mkdir -p /app/date

EXPOSE 8000

# FastAPI 서버 실행
CMD [ "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000" ]