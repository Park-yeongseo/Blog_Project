FROM nginx:alpine

# 기본 nginx html 디렉토리 비우기
RUN rm -rf /usr/share/nginx/html/*

# 프론트엔드 파일들을 nginx 디렉토리로 복사
COPY . /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx 기본값 포트
EXPOSE 80 

# nginx 실행
CMD [ "nginx", "-g", "daemon off;" ]