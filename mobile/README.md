# Caraban ERP - Mobile App

React Native + Expo로 구축된 모바일 애플리케이션입니다.

## 기술 스택

- React Native
- Expo
- TypeScript
- React Navigation
- Zustand (상태 관리)
- Axios

## 시작하기

### 의존성 설치

```bash
pnpm install
```

### 개발 모드 실행

```bash
# Expo 개발 서버 시작
pnpm start

# iOS 시뮬레이터
pnpm ios

# Android 에뮬레이터
pnpm android
```

### Expo Go 앱 사용

1. 스마트폰에 Expo Go 앱 설치
2. `pnpm start` 실행
3. QR 코드 스캔

## 프로젝트 구조

```
src/
├── screens/       # 화면 컴포넌트
├── components/    # 재사용 가능한 컴포넌트
├── navigation/    # 네비게이션 설정
├── services/      # API 서비스
├── stores/        # Zustand 스토어
└── utils/         # 유틸리티 함수
```

## 주요 화면

- Login - 로그인
- Register - 회원가입
- Dashboard - 대시보드
- Products - 상품 목록
- Orders - 주문 목록
- Profile - 프로필

## 빌드

### iOS

```bash
expo build:ios
```

### Android

```bash
expo build:android
```
