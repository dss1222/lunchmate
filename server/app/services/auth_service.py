"""
인증 서비스
회원가입, 로그인, 로그아웃 비즈니스 로직
"""
from typing import Optional
from fastapi import HTTPException

from ..repositories import data_store
from ..core.utils import hash_password, generate_token


class AuthService:
    """인증 관련 비즈니스 로직"""
    
    @staticmethod
    def register(username: str, password: str, name: str, department: str, 
                 level: str, gender: str, age: int) -> dict:
        """회원가입"""
        # 아이디 중복 체크
        if data_store.user_exists(username):
            raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다")
        
        # 새 유저 생성
        user = data_store.create_user({
            "username": username,
            "password": hash_password(password),
            "name": name,
            "department": department,
            "level": level,
            "gender": gender,
            "age": age,
        })
        
        # 비밀번호 제외하고 반환
        return {
            "success": True,
            "user": {k: v for k, v in user.items() if k != "password"}
        }
    
    @staticmethod
    def login(username: str, password: str) -> dict:
        """로그인"""
        # 유저 찾기
        user = data_store.get_user_by_username(username)
        
        if not user or user["password"] != hash_password(password):
            raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 틀렸습니다")
        
        # 기존 세션 제거
        data_store.delete_user_sessions(user["id"])
        
        # 새 세션 생성
        token = generate_token()
        data_store.create_session(token, user["id"])
        
        # 비밀번호 제외하고 반환
        return {
            "success": True,
            "token": token,
            "user": {k: v for k, v in user.items() if k != "password"}
        }
    
    @staticmethod
    def logout(token: str) -> dict:
        """로그아웃"""
        if token:
            data_store.delete_session(token)
        return {"success": True}
    
    @staticmethod
    def get_current_user(token: str) -> Optional[dict]:
        """현재 로그인한 유저 조회"""
        if not token:
            return None
        
        user_id = data_store.get_session(token)
        if not user_id:
            return None
        
        user = data_store.get_user_by_id(user_id)
        if not user:
            return None
        
        # 비밀번호 제외
        return {k: v for k, v in user.items() if k != "password"}

