FROM node:18-alpine

WORKDIR /usr/src/app

# 의존성 파일 복사
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# 의존성 설치
RUN npm install

# 소스 복사
COPY apps/auth ./apps/auth
COPY libs ./libs
COPY proto ./proto

# 빌드
RUN npm run build:auth

# 실행
CMD ["node", "dist/apps/auth/main.js"] 