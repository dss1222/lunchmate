# 🚀 LunchMate 배포 가이드

## 배포 구조

```
프론트엔드 (Vercel) ←→ 백엔드 (Render)
    ↓                      ↓
https://lunchmate.vercel.app    https://lunchmate-api.onrender.com
```

---

## 1️⃣ GitHub에 코드 올리기

먼저 GitHub에 레포지토리를 만들고 코드를 푸시합니다.

```bash
cd /Users/n22508001/Desktop/test

# Git 초기화
git init
git add .
git commit -m "Initial commit: LunchMate 점심 매칭 서비스"

# GitHub 레포지토리 연결 (본인 레포 URL로 변경)
git remote add origin https://github.com/YOUR_USERNAME/lunchmate.git
git branch -M main
git push -u origin main
```

---

## 2️⃣ 백엔드 배포 (Render)

### Step 1: Render 가입
1. https://render.com 접속
2. GitHub 계정으로 가입/로그인

### Step 2: 새 Web Service 생성
1. Dashboard → **New +** → **Web Service**
2. GitHub 레포지토리 연결
3. 설정:
   - **Name**: `lunchmate-api`
   - **Root Directory**: `server`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free` 선택

4. **Create Web Service** 클릭

### Step 3: 배포 완료 확인
- 배포가 완료되면 URL이 생성됩니다
- 예: `https://lunchmate-api.onrender.com`
- `/health` 엔드포인트로 확인: `https://lunchmate-api.onrender.com/health`

> ⚠️ 무료 플랜은 15분 동안 요청이 없으면 슬립 모드로 전환됩니다.
> 첫 요청 시 30초~1분 정도 웨이크업 시간이 필요합니다.

---

## 3️⃣ 프론트엔드 배포 (Vercel)

### Step 1: Vercel 가입
1. https://vercel.com 접속
2. GitHub 계정으로 가입/로그인

### Step 2: 새 프로젝트 생성
1. **Add New...** → **Project**
2. GitHub 레포지토리 Import
3. 설정:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client` (Edit 클릭 → client 입력)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: 환경변수 설정 ⚠️ 중요!
1. **Environment Variables** 섹션에서:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://lunchmate-api.onrender.com` (Render에서 받은 URL)
   
2. **Deploy** 클릭

### Step 4: 배포 완료!
- 배포가 완료되면 URL이 생성됩니다
- 예: `https://lunchmate-xxx.vercel.app`

---

## 4️⃣ 배포 확인 체크리스트

- [ ] 백엔드 Health Check: `https://your-api.onrender.com/health`
- [ ] 프론트엔드 접속: `https://your-app.vercel.app`
- [ ] 점심 참여하기 테스트
- [ ] 점심방 생성/참여 테스트

---

## 🔧 문제 해결

### CORS 에러가 발생하는 경우
백엔드 `server/index.js`에서 CORS 설정을 확인하세요:

```javascript
app.use(cors({
  origin: ['https://your-app.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

### API 연결이 안 되는 경우
1. Vercel 환경변수 `VITE_API_URL`이 올바른지 확인
2. Render 서버가 실행 중인지 확인
3. 브라우저 개발자 도구 → Network 탭에서 API 요청 확인

### 무료 플랜 한계
- **Render 무료**: 월 750시간, 슬립 모드 있음
- **Vercel 무료**: 무제한 배포, 월 100GB 대역폭

---

## 🎉 배포 완료!

해커톤 발표 시 배포된 URL로 라이브 데모를 보여주세요!

### 공유용 링크
```
🍱 LunchMate - 혼밥 탈출 서비스
👉 https://your-app.vercel.app
```

---

## 📱 QR 코드 만들기 (선택)

발표 시 청중이 바로 접속할 수 있도록 QR 코드를 만들어보세요:
- https://qr.io 에서 무료로 생성 가능

