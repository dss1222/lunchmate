# 🍱 LunchMate - 혼밥 탈출! 같이 점심 먹을 사람 찾기

> 사내 점심 매칭 시스템 - 해커톤 프로젝트

## 📋 프로젝트 소개

LunchMate는 혼밥하는 직장인들을 위한 점심 매칭 서비스입니다.
같은 시간, 비슷한 메뉴/가격대를 원하는 동료들과 자동으로 매칭해드립니다!

### 주요 기능

- 🙋‍♂️ **자동 매칭**: 시간/가격대/메뉴 조건이 맞는 동료와 자동 매칭
- 🏠 **점심방**: 직접 방을 만들어 함께 점심 먹을 사람 모집
- 🍽️ **식당 추천**: 조건에 맞는 주변 식당 추천
- 📊 **실시간 통계**: 오늘의 매칭 현황과 인기 메뉴 확인

## 🚀 빠른 시작

### 필수 요구사항

- Node.js 18+ 
- npm 또는 yarn

### 설치 및 실행

#### 1. 백엔드 서버 실행

```bash
cd server
npm install
npm run dev
```

서버가 http://localhost:3001 에서 실행됩니다.

#### 2. 프론트엔드 실행 (새 터미널)

```bash
cd client
npm install
npm run dev
```

프론트엔드가 http://localhost:5173 에서 실행됩니다.

## 📱 화면 구성

| 화면 | 경로 | 설명 |
|------|------|------|
| 홈 | `/` | 메인 화면, 참여하기 버튼 |
| 참여 폼 | `/join` | 시간/가격대/메뉴 선택 |
| 매칭 중 | `/matching` | 실시간 매칭 대기 |
| 매칭 완료 | `/result` | 그룹 정보 및 식당 추천 |
| 매칭 실패 | `/fail` | 대안 제시 |
| 점심방 목록 | `/rooms` | 열린 방 목록 |
| 방 만들기 | `/rooms/create` | 새 점심방 생성 |
| 방 상세 | `/rooms/:id` | 방 정보 및 참여자 |
| 대시보드 | `/dashboard` | 통계 현황 |

## 🛠️ 기술 스택

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express
- In-Memory 데이터 저장 (데모용)

## 📡 API 엔드포인트

### 통계
- `GET /stats` - 오늘의 통계

### 매칭
- `POST /match/join` - 매칭 참여
- `GET /match/status?matchRequestId=xxx` - 매칭 상태 확인
- `DELETE /match/cancel` - 매칭 취소

### 그룹
- `GET /groups` - 전체 그룹 목록
- `GET /groups/:groupId` - 그룹 상세

### 점심방
- `GET /rooms` - 열린 방 목록
- `POST /rooms` - 방 생성
- `GET /rooms/:roomId` - 방 상세
- `POST /rooms/:roomId/join` - 방 참여
- `POST /rooms/:roomId/leave` - 방 나가기

### 식당
- `GET /restaurants` - 식당 목록
- `GET /restaurants/random` - 랜덤 식당 추천

## 🎯 데모 시나리오

1. **자동 매칭 시연**
   - 유저 A: 12:00 / 한식 / 7천~1.2만 선택 후 매칭 시작
   - 유저 B: 같은 조건으로 매칭 시작
   - → 자동으로 매칭 완료!

2. **점심방 시연**
   - 유저 A: "한식 먹을 사람~" 방 생성
   - 유저 B: 점심방 목록에서 해당 방에 참여
   - → 인원 충족 시 매칭 완료!

## 🔮 확장 아이디어

- [ ] SSO 로그인 연동
- [ ] 카카오맵/네이버 지도 API 연동
- [ ] 슬랙/팀즈 알림 연동
- [ ] 뱃지/게이미피케이션 시스템
- [ ] 실제 DB 연동 (PostgreSQL/MongoDB)

## 👥 팀: 식사하러가시조? (2조)

---

Made with ❤️ for 해커톤 2024

