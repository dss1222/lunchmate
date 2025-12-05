"""
🍱 LunchMate API Server
혼밥 탈출! 점심 매칭 서비스

프로젝트 구조:
├── main.py                 # 앱 진입점 (이 파일)
├── app/
│   ├── core/              # 설정 및 유틸리티
│   │   ├── config.py      # 앱 설정
│   │   └── utils.py       # 공통 유틸리티 함수
│   ├── schemas/           # Pydantic 모델 (Request/Response)
│   │   ├── auth.py        # 인증 스키마
│   │   ├── match.py       # 매칭 스키마
│   │   └── room.py        # 점심방 스키마
│   ├── repositories/      # 데이터 접근 계층
│   │   └── data_store.py  # 인메모리 데이터 저장소
│   ├── services/          # 비즈니스 로직
│   │   ├── auth_service.py
│   │   ├── match_service.py
│   │   └── room_service.py
│   └── routers/           # API 엔드포인트 (Controllers)
│       ├── auth.py        # 인증 API
│       ├── match.py       # 매칭 API
│       ├── rooms.py       # 점심방 API
│       ├── users.py       # 유저 API
│       ├── restaurants.py # 식당 API
│       └── stats.py       # 통계 API
"""
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 라우터 임포트
from app.routers import (
    auth_router,
    match_router,
    rooms_router,
    users_router,
    restaurants_router,
    stats_router,
)

# FastAPI 앱 생성
app = FastAPI(
    title="🍱 LunchMate API",
    description="혼밥 탈출! 점심 매칭 서비스",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth_router)
app.include_router(match_router)
app.include_router(rooms_router)
app.include_router(users_router)
app.include_router(restaurants_router)
app.include_router(stats_router)


# 헬스체크 엔드포인트
@app.get("/health", tags=["시스템"])
def health_check():
    """서버 상태 확인"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
    }


# 서버 실행
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
