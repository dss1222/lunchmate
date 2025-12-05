"""
매칭 관련 스키마
"""
from pydantic import BaseModel
from typing import Optional


class Preferences(BaseModel):
    """매칭 선호 옵션"""
    similarAge: bool = False
    sameGender: bool = False
    sameLevel: bool = False


class MatchJoinRequest(BaseModel):
    """매칭 참여 요청"""
    userId: Optional[str] = None
    name: Optional[str] = "익명"
    department: Optional[str] = "미지정"
    gender: Optional[str] = None
    age: Optional[int] = None
    level: Optional[str] = None
    timeSlot: str
    priceRange: str
    menu: str
    preferences: Optional[Preferences] = None


class MatchCancelRequest(BaseModel):
    """매칭 취소 요청"""
    matchRequestId: str

