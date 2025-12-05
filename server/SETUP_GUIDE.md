# 🐍 FastAPI 서버 설치 가이드

> 팀원들을 위한 Python 환경 설정 및 서버 실행 가이드

---

## ⚠️ 발생했던 문제들 & 해결 방법

### 문제 1: macOS 시스템 Python 보호

```
error: externally-managed-environment
× This environment is externally managed
```

**원인**: macOS의 Homebrew Python은 시스템 보호를 위해 직접 패키지 설치를 막습니다.

**해결**: 가상환경(venv)을 만들어서 사용해야 합니다.

---

### 문제 2: Python 3.14 호환성

```
Failed to build pydantic-core
TypeError: ForwardRef._evaluate() missing 1 required keyword-only argument
```

**원인**: Python 3.14가 너무 최신이라 구버전 라이브러리와 호환되지 않음

**해결**: `requirements.txt`에서 최신 버전 사용 (버전 고정 제거)

```txt
# 기존 (문제 발생)
fastapi==0.104.1
pydantic==2.5.2

# 수정 후 (해결)
fastapi>=0.115.0
pydantic>=2.10.0
```

---

### 문제 3: 포트 충돌

```
ERROR: [Errno 48] Address already in use
```

**원인**: 포트 3001을 다른 프로세스가 사용 중

**해결**: 기존 프로세스 종료 후 재실행
```bash
lsof -ti:3001 | xargs kill -9
```

---

## 🚀 설치 가이드 (따라하기)

### 1단계: Python 확인

터미널에서 Python이 설치되어 있는지 확인합니다.

```bash
python3 --version
```

✅ `Python 3.10` 이상이면 OK!

❌ 없다면 설치:
```bash
# macOS (Homebrew)
brew install python

# Windows
# https://www.python.org/downloads/ 에서 다운로드
```

---

### 2단계: 프로젝트 폴더로 이동

```bash
cd /Users/n22508001/Desktop/test/server
```

---

### 3단계: 가상환경 생성 ⭐ 중요!

```bash
python3 -m venv venv
```

이 명령어는 `venv` 폴더를 생성합니다.

---

### 4단계: 가상환경 활성화

**macOS / Linux:**
```bash
source venv/bin/activate
```

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
venv\Scripts\activate.bat
```

✅ 활성화되면 터미널 앞에 `(venv)`가 표시됩니다:
```
(venv) username@computer server %
```

---

### 5단계: 패키지 설치

```bash
pip install -r requirements.txt
```

설치되는 패키지:
- **FastAPI** - 웹 프레임워크
- **Uvicorn** - ASGI 서버
- **Pydantic** - 데이터 검증

---

### 6단계: 서버 실행 🎉

```bash
uvicorn main:app --reload --port 3001
```

출력 예시:
```
INFO:     Uvicorn running on http://127.0.0.1:3001 (Press CTRL+C to quit)
INFO:     Started reloader process [12345]
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## ✅ 실행 확인

| URL | 설명 |
|-----|------|
| http://localhost:3001/health | 서버 상태 확인 |
| http://localhost:3001/docs | **Swagger UI** (API 문서 & 테스트) |
| http://localhost:3001/redoc | ReDoc (API 문서) |

브라우저에서 http://localhost:3001/docs 를 열어보세요!

---

## 📋 매일 서버 실행할 때 (요약)

```bash
# 1. server 폴더로 이동
cd /Users/n22508001/Desktop/test/server

# 2. 가상환경 활성화
source venv/bin/activate

# 3. 서버 실행
uvicorn main:app --reload --port 3001
```

**한 줄로:**
```bash
cd /Users/n22508001/Desktop/test/server && source venv/bin/activate && uvicorn main:app --reload --port 3001
```

---

## 🔧 문제 해결

### "command not found: uvicorn"
→ 가상환경이 활성화되지 않음. `source venv/bin/activate` 실행

### "Address already in use"
→ 포트 3001 충돌. 기존 프로세스 종료:
```bash
lsof -ti:3001 | xargs kill -9
```
또는 다른 포트 사용:
```bash
uvicorn main:app --reload --port 3002
```

### "No module named 'fastapi'"
→ 패키지 미설치. 가상환경 활성화 후:
```bash
pip install -r requirements.txt
```

### 가상환경 재생성이 필요한 경우
```bash
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🛑 서버 종료

터미널에서 `Ctrl + C` 누르면 종료됩니다.

가상환경 비활성화:
```bash
deactivate
```

---

## 📁 서버 폴더 구조

```
server/
├── main.py           # FastAPI 서버 코드
├── requirements.txt  # Python 패키지 목록
├── venv/             # 가상환경 (git에 포함 안됨)
├── render.yaml       # 배포 설정
└── SETUP_GUIDE.md    # 이 문서
```

---

## 💡 팁

1. **가상환경은 팀원마다 각자 생성**해야 합니다 (venv 폴더는 .gitignore에 포함)
2. **새 패키지 설치** 시: `pip install 패키지명` 후 `pip freeze > requirements.txt`
3. **VSCode 사용자**: Python 인터프리터를 `venv/bin/python`으로 설정하면 편합니다

---

작성일: 2024년 해커톤

