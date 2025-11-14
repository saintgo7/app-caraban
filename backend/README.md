# Caraban ERP - Backend API

Node.js + Express + TypeScript로 구축된 RESTful API 서버입니다.

## 기술 스택

- Node.js 18+
- Express.js
- TypeScript
- Sequelize (ORM)
- **하이브리드 데이터베이스**
  - **SQLite** - 로컬 개발용
  - **MariaDB** - 프로덕션/스테이징용
- JWT (인증)
- Winston (로깅)

## 하이브리드 데이터베이스

이 백엔드는 환경에 따라 자동으로 데이터베이스를 선택합니다:

### SQLite (기본값)
- 로컬 개발에 최적화
- 별도 서버 설치 불필요
- 파일 기반: `database.sqlite`

### MariaDB
- 프로덕션/스테이징 환경용
- 높은 성능과 동시성
- AWS EC2 배포 최적화

### 전환 방법

`.env` 파일에서 `DB_TYPE` 변수 변경:

```bash
# SQLite 사용
DB_TYPE=sqlite
SQLITE_PATH=./database.sqlite

# MariaDB 사용
DB_TYPE=mariadb
DB_HOST=localhost
DB_PORT=3306
DB_NAME=caraban_erp
DB_USER=root
DB_PASSWORD=your_password
```

## 시작하기

### 환경 변수 설정

`.env.example`을 `.env`로 복사하고 설정:

```bash
cp .env.example .env
```

기본 설정(SQLite)으로 즉시 시작 가능합니다!

### 개발 모드 실행

```bash
pnpm install
pnpm dev
```

서버 시작 시 사용 중인 데이터베이스 타입이 표시됩니다:
```
🔧 Configuring SQLite database...
✅ Database connection established successfully (SQLITE).
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
│   ├── database.ts    # 하이브리드 DB 설정
│   └── logger.ts      # Winston 로거
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
- **자동 데이터베이스 전환**

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `DB_TYPE` | 데이터베이스 타입 (sqlite/mariadb) | sqlite |
| `SQLITE_PATH` | SQLite 파일 경로 | ./database.sqlite |
| `DB_HOST` | MariaDB 호스트 | localhost |
| `DB_NAME` | MariaDB 데이터베이스명 | caraban_erp |
| `DB_USER` | MariaDB 사용자명 | root |
| `DB_PASSWORD` | MariaDB 비밀번호 | - |
| `PORT` | 서버 포트 | 5000 |
| `JWT_SECRET` | JWT 시크릿 키 | - |

## 포트

기본 포트: `5000`

## 데이터베이스 마이그레이션

개발 환경에서는 자동으로 스키마를 동기화합니다 (`alter: true`).

프로덕션에서 강제 동기화가 필요한 경우:
```bash
DB_SYNC=true pnpm start
```

**주의**: 프로덕션에서는 신중하게 사용하세요!
