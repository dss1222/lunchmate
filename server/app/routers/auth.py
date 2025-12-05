"""
인증 API 라우터
회원가입, 로그인, 로그아웃
"""
from fastapi import APIRouter, Header, HTTPException

from ..schemas import RegisterRequest, LoginRequest
from ..services import AuthService

router = APIRouter(prefix="/auth", tags=["인증"])


@router.post("/register")
def register(request: RegisterRequest):
    """회원가입"""
    return AuthService.register(
        username=request.username,
        password=request.password,
        name=request.name,
        department=request.department,
        level=request.level,
        gender=request.gender,
        age=request.age,
    )


@router.post("/login")
def login(request: LoginRequest):
    """로그인"""
    return AuthService.login(
        username=request.username,
        password=request.password,
    )


@router.post("/logout")
def logout(authorization: str = Header(None)):
    """로그아웃"""
    token = authorization.replace("Bearer ", "") if authorization else None
    return AuthService.logout(token)


@router.get("/me")
def get_me(authorization: str = Header(None)):
    """현재 로그인한 유저 정보"""
    if not authorization:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    
    token = authorization.replace("Bearer ", "")
    user = AuthService.get_current_user(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    
    return user

