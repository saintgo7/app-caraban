# Caraban ERP - Shared Library

백엔드, 웹, 모바일에서 공유하는 타입 정의와 유틸리티 함수입니다.

## 포함 내용

### Types

- `User` - 사용자 타입
- `Product` - 상품 타입
- `Order` - 주문 타입
- `Category` - 카테고리 타입
- API 관련 타입들

### Constants

- `USER_ROLES` - 사용자 역할
- `ORDER_STATUS` - 주문 상태
- `PAYMENT_STATUS` - 결제 상태
- `DEFAULT_PAGINATION` - 페이지네이션 기본값
- `VALIDATION` - 검증 상수

### Utils

- 이메일 검증
- 비밀번호 검증
- 전화번호 검증
- 문자열 정제
- 통화 포맷
- 날짜 포맷

## 사용법

```typescript
import { User, UserRole, isValidEmail } from '@caraban/shared';

const user: User = {
  id: '1',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'customer',
  isActive: true,
};

if (isValidEmail(user.email)) {
  console.log('Valid email');
}
```

## 빌드

```bash
pnpm build
```
