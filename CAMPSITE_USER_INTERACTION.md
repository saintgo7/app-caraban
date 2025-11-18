# 카라반 사용자-캠프장 연계 모듈 가이드

캠프장과 사용자 간의 상호작용을 위한 완전한 모듈입니다. 문의 시스템, 위시리스트, 실시간 예약 등의 기능을 제공합니다.

## 📋 목차

- [기능 개요](#기능-개요)
- [백엔드 API](#백엔드-api)
- [프론트엔드 컴포넌트](#프론트엔드-컴포넌트)
- [데이터베이스 스키마](#데이터베이스-스키마)
- [사용 예시](#사용-예시)
- [디자인 가이드](#디자인-가이드)

## 🌟 기능 개요

### 1. 문의 시스템 (Inquiry System)

사용자가 캠프장에 대해 문의하고, 캠프장 소유자가 답변할 수 있는 완전한 Q&A 시스템입니다.

**주요 기능:**
- ✅ 다양한 카테고리 (일반, 예약, 시설, 요금, 취소/환불, 기타)
- ✅ 우선순위 설정 (낮음, 보통, 긴급)
- ✅ 상태 관리 (답변 대기, 답변 완료, 종료)
- ✅ 실시간 답변 및 읽음 표시
- ✅ 문의 통계 대시보드
- ✅ 검색 및 필터링

### 2. 위시리스트 (Wishlist)

사용자가 마음에 드는 캠프장을 저장하고 관리할 수 있는 기능입니다.

**주요 기능:**
- ❤️ 원클릭 저장/삭제
- 📝 개인 메모 작성
- 🔔 예약 가능 시 알림 설정
- 📊 저장한 캠프장 목록 관리
- 🔍 빠른 접근 및 예약 전환

### 3. 캠프장 상세 페이지 향상

**추가된 기능:**
- 📸 이미지 갤러리 (좌우 스와이프)
- ⭐ 별점 및 리뷰 요약
- 📍 위치 정보 및 편의시설
- 💬 즉시 문의하기 버튼
- ❤️ 위시리스트 추가 버튼
- 📅 실시간 예약 가능 여부

## 🔧 백엔드 API

### 문의 API Endpoints

#### 1. 문의 생성
```http
POST /api/inquiries
Authorization: Bearer {token}
Content-Type: application/json

{
  "campsiteId": "uuid",
  "subject": "예약 관련 문의입니다",
  "message": "6월 15일에 예약 가능한가요?",
  "category": "booking",
  "priority": "normal"
}
```

**응답:**
```json
{
  "message": "Inquiry created successfully",
  "inquiry": {
    "id": "uuid",
    "userId": "uuid",
    "campsiteId": "uuid",
    "subject": "예약 관련 문의입니다",
    "message": "6월 15일에 예약 가능한가요?",
    "category": "booking",
    "priority": "normal",
    "status": "pending",
    "isRead": false,
    "createdAt": "2025-01-18T10:00:00Z"
  }
}
```

#### 2. 내 문의 내역 조회
```http
GET /api/inquiries/my-inquiries?status=pending&page=1&limit=10
Authorization: Bearer {token}
```

#### 3. 문의 상세 조회
```http
GET /api/inquiries/:id
Authorization: Bearer {token}
```

#### 4. 문의 답변 (소유자/관리자)
```http
POST /api/inquiries/:id/respond
Authorization: Bearer {token}
Content-Type: application/json

{
  "response": "네, 6월 15일은 예약 가능합니다!",
  "status": "answered"
}
```

#### 5. 캠프장별 문의 조회 (소유자/관리자)
```http
GET /api/inquiries/campsite/:campsiteId?status=pending&priority=high
Authorization: Bearer {token}
```

#### 6. 문의 통계
```http
GET /api/inquiries/stats?campsiteId=uuid
Authorization: Bearer {token}
```

**응답:**
```json
{
  "total": 150,
  "pending": 23,
  "answered": 120,
  "closed": 7,
  "unread": 15,
  "todayInquiries": 8,
  "categoryStats": [
    { "category": "booking", "count": 65 },
    { "category": "facilities", "count": 40 },
    { "category": "general", "count": 30 }
  ]
}
```

### 위시리스트 API Endpoints

#### 1. 위시리스트에 추가
```http
POST /api/wishlist
Authorization: Bearer {token}
Content-Type: application/json

{
  "campsiteId": "uuid",
  "notes": "가족 여행으로 좋을 것 같음",
  "notifyOnAvailability": true
}
```

#### 2. 위시리스트 조회
```http
GET /api/wishlist?page=1&limit=20
Authorization: Bearer {token}
```

**응답:**
```json
{
  "wishlist": [
    {
      "id": "uuid",
      "userId": "uuid",
      "campsiteId": "uuid",
      "notes": "가족 여행으로 좋을 것 같음",
      "notifyOnAvailability": true,
      "createdAt": "2025-01-18T10:00:00Z",
      "campsite": {
        "id": "uuid",
        "name": "청평 캠핑장",
        "location": "경기도 가평군",
        "pricePerNight": 50000,
        "rating": 4.8,
        "images": ["url1", "url2"],
        "amenities": ["wifi", "parking", "shower"]
      }
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

#### 3. 위시리스트 확인
```http
GET /api/wishlist/check/:campsiteId
Authorization: Bearer {token}
```

**응답:**
```json
{
  "inWishlist": true,
  "wishlistItem": {
    "id": "uuid",
    "notes": "가족 여행으로 좋을 것 같음",
    "notifyOnAvailability": true
  }
}
```

#### 4. 위시리스트 항목 수정
```http
PATCH /api/wishlist/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "notes": "여름 휴가 1순위",
  "notifyOnAvailability": false
}
```

#### 5. 위시리스트에서 삭제
```http
DELETE /api/wishlist/:campsiteId
Authorization: Bearer {token}
```

#### 6. 캠프장 위시리스트 통계
```http
GET /api/wishlist/stats/:campsiteId
Authorization: Bearer {token}
```

**응답:**
```json
{
  "totalWishlists": 256,
  "withNotifications": 128
}
```

## 💻 프론트엔드 컴포넌트

### 1. InquiryForm 컴포넌트

문의 작성 모달 컴포넌트입니다.

**사용 예시:**
```tsx
import InquiryForm from '../components/InquiryForm';

function CampsiteDetail() {
  const [showInquiry, setShowInquiry] = useState(false);

  return (
    <>
      <button onClick={() => setShowInquiry(true)}>
        문의하기
      </button>

      {showInquiry && (
        <InquiryForm
          campsiteId="uuid"
          campsiteName="청평 캠핑장"
          onClose={() => setShowInquiry(false)}
          onSuccess={() => {
            alert('문의가 전송되었습니다!');
            setShowInquiry(false);
          }}
        />
      )}
    </>
  );
}
```

**Props:**
- `campsiteId` (string): 캠프장 ID
- `campsiteName` (string): 캠프장 이름
- `onClose` (function): 모달 닫기 핸들러
- `onSuccess` (function, optional): 전송 성공 핸들러

**주요 기능:**
- 📝 6가지 카테고리 선택
- ⚡ 3단계 우선순위 (낮음, 보통, 긴급)
- 📊 실시간 글자 수 카운터
- ✅ 유효성 검증
- 🎨 그라데이션 헤더 디자인
- 💫 슬라이드업 애니메이션

### 2. MyInquiries 페이지

사용자의 문의 내역을 관리하는 페이지입니다.

**라우팅:**
```tsx
import MyInquiries from './pages/MyInquiries';

<Route path="/my-inquiries" element={<MyInquiries />} />
```

**주요 기능:**
- 📋 문의 목록 (페이지네이션)
- 🔍 상태별 필터링 (전체, 답변 대기, 답변 완료, 종료)
- 📊 카테고리 및 우선순위 표시
- 💬 답변 미리보기
- 🔔 읽지 않은 문의 하이라이트
- 📱 상세 보기 모달

### 3. MyWishlist 페이지

사용자의 위시리스트를 관리하는 페이지입니다.

**라우팅:**
```tsx
import MyWishlist from './pages/MyWishlist';

<Route path="/wishlist" element={<MyWishlist />} />
```

**주요 기능:**
- 🎴 카드 그리드 레이아웃
- ❤️ 즉시 삭제 버튼
- 📝 개인 메모 편집
- 🔔 알림 설정 토글
- 📅 즉시 예약하기 버튼
- 🏷️ 편의시설 태그 표시

### 4. OwnerInquiries 페이지

캠프장 소유자를 위한 문의 관리 대시보드입니다.

**라우팅:**
```tsx
import OwnerInquiries from './pages/OwnerInquiries';

<Route path="/owner/inquiries" element={<OwnerInquiries />} />
```

**주요 기능:**
- 📊 실시간 통계 (전체, 답변 대기, 답변 완료, 읽지 않음)
- 🔍 강력한 검색 및 필터
- ⚡ 우선순위별 정렬
- 📧 답변 작성 에디터
- ✅ 상태 자동 업데이트
- 📱 반응형 디자인

## 🗄️ 데이터베이스 스키마

### Inquiries 테이블

```sql
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campsiteId UUID NOT NULL REFERENCES campsites(id) ON DELETE CASCADE,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending', 'answered', 'closed') DEFAULT 'pending',
  priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
  category ENUM('general', 'booking', 'facilities', 'pricing', 'cancellation', 'other'),
  response TEXT,
  respondedBy UUID REFERENCES users(id),
  respondedAt TIMESTAMP,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_userId (userId),
  INDEX idx_campsiteId (campsiteId),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
);
```

### Wishlists 테이블

```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campsiteId UUID NOT NULL REFERENCES campsites(id) ON DELETE CASCADE,
  notes TEXT,
  notifyOnAvailability BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE INDEX idx_user_campsite (userId, campsiteId),
  INDEX idx_userId (userId),
  INDEX idx_campsiteId (campsiteId)
);
```

## 🎨 디자인 가이드

### 색상 팔레트

```css
/* Primary Colors */
--green-50: #f0fdf4;
--green-600: #16a34a;
--green-700: #15803d;

/* Status Colors */
--yellow-100: #fef3c7; /* 답변 대기 */
--yellow-700: #a16207;

--green-100: #dcfce7; /* 답변 완료 */
--green-700: #15803d;

--red-100: #fee2e2;    /* 긴급 */
--red-600: #dc2626;

--blue-100: #dbeafe;   /* 보통 */
--blue-600: #2563eb;
```

### 애니메이션

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

### 반응형 디자인

```css
/* Mobile First */
.container {
  @apply px-4;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    @apply px-6;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    @apply px-8 max-w-7xl mx-auto;
  }
}
```

## 📱 사용 예시

### 1. 사용자 플로우: 문의하기

```
1. 캠프장 상세 페이지 방문
   ↓
2. "문의하기" 버튼 클릭
   ↓
3. 문의 양식 작성
   - 카테고리 선택
   - 제목 입력
   - 상세 내용 작성
   ↓
4. "문의 전송" 버튼 클릭
   ↓
5. 성공 메시지 확인
   ↓
6. "나의 문의 내역"에서 확인 가능
```

### 2. 소유자 플로우: 답변하기

```
1. 소유자 대시보드 로그인
   ↓
2. "문의 관리" 메뉴 클릭
   ↓
3. 답변 대기 중인 문의 확인
   ↓
4. 문의 클릭하여 상세 보기
   ↓
5. 답변 작성
   ↓
6. "답변 전송" 버튼 클릭
   ↓
7. 상태가 "답변 완료"로 자동 변경
   ↓
8. 사용자에게 이메일 알림 발송 (선택사항)
```

### 3. 사용자 플로우: 위시리스트

```
1. 캠프장 둘러보기
   ↓
2. 마음에 드는 캠프장에서 ❤️ 버튼 클릭
   ↓
3. 위시리스트에 추가됨
   ↓
4. "내 위시리스트" 페이지에서 확인
   ↓
5. 메모 추가 및 알림 설정
   ↓
6. "예약하기" 버튼으로 바로 예약 가능
```

## 🚀 시작하기

### 1. 마이그레이션 실행

```bash
cd backend
npm run migrate
```

### 2. 서버 시작

```bash
# 백엔드
cd backend
npm run dev

# 프론트엔드
cd web
npm run dev
```

### 3. 테스트

```bash
# API 테스트
curl -X POST http://localhost:5000/api/inquiries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "campsiteId": "uuid",
    "subject": "테스트 문의",
    "message": "테스트 메시지입니다",
    "category": "general"
  }'
```

## 📝 주요 파일 목록

### 백엔드

```
backend/src/
├── models/
│   ├── Inquiry.ts                 # 문의 모델
│   └── Wishlist.ts                # 위시리스트 모델
├── controllers/
│   ├── inquiryController.ts       # 문의 컨트롤러
│   └── wishlistController.ts      # 위시리스트 컨트롤러
├── routes/
│   ├── inquiryRoutes.ts           # 문의 라우트
│   ├── wishlistRoutes.ts          # 위시리스트 라우트
│   └── index.ts                   # 라우트 통합
└── migrations/
    └── 20250118000000-create-inquiry-wishlist.ts
```

### 프론트엔드

```
web/src/
├── components/
│   └── InquiryForm.tsx            # 문의 폼 컴포넌트
├── pages/
│   ├── MyInquiries.tsx            # 내 문의 페이지
│   ├── MyWishlist.tsx             # 내 위시리스트 페이지
│   └── OwnerInquiries.tsx         # 소유자 문의 관리
└── tailwind.config.js             # Tailwind 설정 (애니메이션 포함)
```

## 💡 추가 개선 사항 (향후)

- [ ] 실시간 알림 (WebSocket)
- [ ] 이메일 알림 자동 발송
- [ ] 문의 템플릿 (자주 묻는 질문)
- [ ] 파일 첨부 기능
- [ ] 문의 평가 시스템
- [ ] 다국어 지원
- [ ] 모바일 앱 푸시 알림

---

문의 사항이 있으시면 언제든지 연락 주세요! 🏕️
