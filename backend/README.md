# Caraban ERP - Backend API

Node.js + Express + TypeScript로 구축된 RESTful API 서버입니다.

## 기술 스택

- Node.js 18+
- Express.js
- TypeScript
- Sequelize (ORM)
- MariaDB
- JWT (인증)
- Winston (로깅)

## 시작하기

### 환경 변수 설정

`.env.example`을 `.env`로 복사하고 설정:

```bash
cp .env.example .env
```

### 개발 모드 실행

```bash
pnpm install
pnpm dev
```

### 프로덕션 빌드

```bash
pnpm build
pnpm start
```

## API 구조

```
src/
├── config/        # 데이터베이스, 로거 등 설정
├── controllers/   # 요청 핸들러
├── models/        # Sequelize 모델
├── routes/        # API 라우트
├── middlewares/   # 커스텀 미들웨어
├── services/      # 비즈니스 로직
└── index.ts       # 앱 엔트리 포인트
```

## 주요 기능

- 사용자 인증 및 권한 관리
- 상품 관리
- 주문 처리
- 에러 핸들링
- 요청 검증
- Rate limiting
- 로깅

## 포트

기본 포트: `5000`
