# Caraban ERP System

전자상거래를 위한 종합 ERP 시스템으로, React Web과 React Native 모바일 앱을 지원하는 하이브리드 애플리케이션입니다.

## 📋 프로젝트 개요

**Caraban ERP**는 전자상거래 비즈니스를 위한 완전한 관리 솔루션입니다.

### 주요 기능

- 🔐 사용자 인증 및 권한 관리 (Admin, Manager, Staff, Customer)
- 📦 상품 관리 (카테고리, 재고, 가격 관리)
- 🛒 주문 관리 (주문 생성, 상태 추적, 결제 관리)
- 📊 대시보드 및 리포팅
- 📱 웹 및 모바일 지원

## 🏗️ 기술 스택

### 백엔드
- **Node.js** - 런타임 환경
- **Express** - 웹 프레임워크
- **TypeScript** - 타입 안정성
- **Sequelize** - ORM
- **SQLite** - 로컬 개발용 데이터베이스
- **MariaDB** - 프로덕션 데이터베이스 (AWS EC2)
- **JWT** - 인증

### 웹 프론트엔드
- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **TypeScript** - 타입 안정성
- **TailwindCSS** - 스타일링
- **React Router** - 라우팅
- **Zustand** - 상태 관리
- **React Query** - 서버 상태 관리
- **Axios** - HTTP 클라이언트

### 모바일 앱
- **React Native** - 모바일 프레임워크
- **Expo** - 개발 플랫폼
- **TypeScript** - 타입 안정성
- **React Navigation** - 네비게이션
- **Zustand** - 상태 관리
- **Axios** - HTTP 클라이언트

### 인프라
- **Docker** - 컨테이너화
- **Docker Compose** - 오케스트레이션
- **AWS EC2** - 호스팅
- **Redis** - 캐싱 (선택사항)

## 📁 프로젝트 구조

```
app-caraban/
├── backend/          # Node.js API 서버
│   ├── src/
│   │   ├── config/       # 설정 파일
│   │   ├── controllers/  # 컨트롤러
│   │   ├── models/       # Sequelize 모델
│   │   ├── routes/       # API 라우트
│   │   ├── middlewares/  # 미들웨어
│   │   ├── services/     # 비즈니스 로직
│   │   └── index.ts      # 엔트리 포인트
│   ├── Dockerfile
│   └── package.json
│
├── web/              # React 웹 애플리케이션
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── services/     # API 서비스
│   │   ├── stores/       # Zustand 스토어
│   │   ├── hooks/        # 커스텀 훅
│   │   └── App.tsx       # 메인 앱
│   ├── Dockerfile
│   └── package.json
│
├── mobile/           # React Native 모바일 앱
│   ├── src/
│   │   ├── screens/      # 화면 컴포넌트
│   │   ├── components/   # React Native 컴포넌트
│   │   ├── navigation/   # 네비게이션 설정
│   │   ├── services/     # API 서비스
│   │   └── stores/       # Zustand 스토어
│   ├── App.tsx
│   └── package.json
│
├── shared/           # 공유 타입 및 유틸리티
│   ├── src/
│   │   ├── types/        # TypeScript 타입 정의
│   │   ├── constants/    # 상수
│   │   └── utils/        # 유틸리티 함수
│   └── package.json
│
├── docker-compose.yml    # Docker Compose 설정
├── .env                  # 환경 변수
├── .gitignore
├── package.json          # 워크스페이스 루트
├── pnpm-workspace.yaml   # pnpm 워크스페이스 설정
└── README.md
```

## 🗄️ 하이브리드 데이터베이스 시스템

이 프로젝트는 **SQLite**와 **MariaDB**를 환경에 따라 자동으로 선택하는 하이브리드 데이터베이스 시스템을 사용합니다.

### 데이터베이스 선택 기준

| 환경 | 데이터베이스 | 이유 |
|------|------------|------|
| **로컬 개발** | SQLite | 빠른 설정, 별도 서버 불필요, 간단한 파일 기반 |
| **프로덕션/스테이징** | MariaDB | 높은 성능, 동시성 지원, AWS EC2 배포 최적화 |

### 데이터베이스 전환 방법

`.env` 파일의 `DB_TYPE` 변수를 변경하면 됩니다:

**SQLite 사용 (기본값)**
```bash
DB_TYPE=sqlite
SQLITE_PATH=./backend/database.sqlite
```

**MariaDB 사용**
```bash
DB_TYPE=mariadb
DB_HOST=localhost
DB_PORT=3306
DB_NAME=caraban_erp
DB_USER=caraban
DB_PASSWORD=your_password
```

### 장점

✅ **개발 속도**: SQLite로 즉시 개발 시작 (설치 불필요)
✅ **유연성**: 환경 변수 하나로 DB 전환
✅ **프로덕션 준비**: MariaDB로 확장 가능
✅ **동일한 코드**: Sequelize ORM이 모든 차이 처리

## 🚀 시작하기

### 필수 요구사항

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Docker** & **Docker Compose** (선택사항)
- **MariaDB** >= 10.6 (프로덕션 배포 시, SQLite는 자동 포함)

### 설치

1. **저장소 클론**

```bash
git clone <repository-url>
cd app-caraban
```

2. **의존성 설치**

```bash
pnpm install
```

3. **환경 변수 설정**

`.env.example` 파일을 `.env`로 복사하고 필요한 값을 설정합니다:

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 데이터베이스 및 기타 설정을 구성합니다.

**중요**: 기본 설정은 SQLite를 사용하므로 별도 데이터베이스 설치 없이 바로 시작할 수 있습니다!

### 개발 환경 실행

#### 방법 1: SQLite로 빠른 시작 (권장 - 로컬 개발)

```bash
# SQLite 사용 (기본값, 별도 DB 서버 불필요)
# .env 파일에서 DB_TYPE=sqlite 확인

# 백엔드 + 웹 시작
docker-compose up backend web -d

# 또는 로컬에서 직접 실행
pnpm dev
```

서비스 접속:
- 웹 애플리케이션: http://localhost:3000
- API 서버: http://localhost:5000
- 데이터베이스: `backend/database.sqlite` 파일

#### 방법 2: MariaDB로 실행 (프로덕션 환경 테스트)

```bash
# .env 파일 수정
DB_TYPE=mariadb

# MariaDB 포함 모든 서비스 시작
docker-compose --profile mariadb up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

서비스 접속:
- 웹 애플리케이션: http://localhost:3000
- API 서버: http://localhost:5000
- MariaDB: localhost:3306

#### 방법 2: 로컬 실행

**1. MariaDB 시작**

```bash
# Docker로 MariaDB만 실행
docker-compose up -d mariadb
```

**2. 백엔드 실행**

```bash
cd backend
cp .env.example .env
# .env 파일 수정
pnpm install
pnpm dev
```

**3. 웹 프론트엔드 실행**

```bash
cd web
cp .env.example .env
# .env 파일 수정
pnpm install
pnpm dev
```

**4. 모바일 앱 실행**

```bash
cd mobile
pnpm install
pnpm start

# iOS 실행
pnpm ios

# Android 실행
pnpm android
```

### 루트에서 전체 개발 환경 실행

```bash
# 모든 패키지 개발 모드 동시 실행
pnpm dev

# 개별 패키지 실행
pnpm dev:backend
pnpm dev:web
pnpm dev:mobile
```

## 📝 API 엔드포인트

### 인증 (Authentication)

- `POST /api/auth/register` - 사용자 등록
- `POST /api/auth/login` - 로그인
- `GET /api/auth/profile` - 프로필 조회 (인증 필요)
- `PUT /api/auth/profile` - 프로필 수정 (인증 필요)
- `PUT /api/auth/change-password` - 비밀번호 변경 (인증 필요)

### 상품 (Products)

- `GET /api/products` - 상품 목록 조회
- `GET /api/products/:id` - 상품 상세 조회
- `POST /api/products` - 상품 생성 (Admin/Manager)
- `PUT /api/products/:id` - 상품 수정 (Admin/Manager)
- `DELETE /api/products/:id` - 상품 삭제 (Admin/Manager)
- `PATCH /api/products/:id/stock` - 재고 업데이트 (Admin/Manager/Staff)

### 주문 (Orders)

- 추가 예정

## 🗄️ 데이터베이스 스키마

### 주요 테이블

- **users** - 사용자 정보
- **categories** - 상품 카테고리
- **products** - 상품 정보
- **orders** - 주문 정보
- **order_items** - 주문 상세 항목

자세한 스키마는 `backend/src/models/` 디렉토리를 참조하세요.

## 🔒 사용자 역할

- **admin** - 모든 권한
- **manager** - 상품, 주문 관리
- **staff** - 재고 관리, 주문 처리
- **customer** - 주문 생성, 자신의 주문 조회

## 🧪 테스트

```bash
# 전체 테스트 실행
pnpm test

# 백엔드 테스트
pnpm --filter backend test

# 웹 테스트
pnpm --filter web test
```

## 🏗️ 빌드

```bash
# 전체 빌드
pnpm build

# 개별 빌드
pnpm build:backend
pnpm build:web
```

## 🚢 배포

### AWS EC2 배포

1. **EC2 인스턴스 준비**
   - Ubuntu 20.04 LTS 이상
   - Docker 및 Docker Compose 설치

2. **코드 배포**

```bash
# 저장소 클론
git clone <repository-url>
cd app-caraban

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# Docker Compose로 실행
docker-compose up -d
```

3. **Nginx 리버스 프록시 설정** (선택사항)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

## 📚 개발 가이드

### 코드 스타일

- ESLint와 TypeScript 규칙을 따릅니다
- Prettier를 사용한 코드 포맷팅 (권장)

```bash
# Linting
pnpm lint

# Linting 자동 수정
pnpm lint:fix
```

### 새로운 API 엔드포인트 추가

1. `backend/src/models/` - 모델 정의
2. `backend/src/controllers/` - 컨트롤러 로직 작성
3. `backend/src/routes/` - 라우트 등록
4. `shared/src/types/` - 타입 정의 (공유)

### 새로운 페이지 추가 (웹)

1. `web/src/pages/` - 페이지 컴포넌트 생성
2. `web/src/App.tsx` - 라우트 추가

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 👥 팀

- 개발자: [Your Name]
- 이메일: [your-email@example.com]

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트를 사용합니다:
- Node.js
- React
- React Native
- Express
- Sequelize
- TailwindCSS
- 그 외 여러 훌륭한 라이브러리들
