"""
인증 관련 스키마
"""
from pydantic import BaseModel


class RegisterRequest(BaseModel):
    """회원가입 요청"""
    username: str
    password: str
    name: str
    department: str
    level: str  # intern, staff, assistant, manager, deputy, general, director
    gender: str  # male, female
    age: int


class LoginRequest(BaseModel):
    """로그인 요청"""
    username: str
    password: str

