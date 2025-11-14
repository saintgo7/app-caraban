# Caraban ERP - Web Application

React + Vite + TypeScript로 구축된 웹 애플리케이션입니다.

## 기술 스택

- React 18
- Vite
- TypeScript
- TailwindCSS
- React Router
- Zustand (상태 관리)
- React Query (서버 상태)
- Axios

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

브라우저에서 http://localhost:3000 접속

### 프로덕션 빌드

```bash
pnpm build
pnpm preview
```

## 프로젝트 구조

```
src/
├── components/    # 재사용 가능한 컴포넌트
├── pages/         # 페이지 컴포넌트
├── services/      # API 서비스
├── stores/        # Zustand 스토어
├── hooks/         # 커스텀 훅
├── utils/         # 유틸리티 함수
├── types/         # TypeScript 타입
└── App.tsx        # 메인 앱
```

## 주요 페이지

- `/login` - 로그인
- `/register` - 회원가입
- `/dashboard` - 대시보드
- `/products` - 상품 관리
- `/orders` - 주문 관리
- `/profile` - 프로필

## 포트

기본 포트: `3000`
