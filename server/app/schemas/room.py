"""
점심방 관련 스키마
"""
from pydantic import BaseModel
from typing import Optional


class RoomCreateRequest(BaseModel):
    """점심방 생성 요청"""
    title: str
    timeSlot: str
    menu: str
    priceRange: Optional[str] = "mid"
    maxCount: int
    creatorId: Optional[str] = None
    creatorName: Optional[str] = "방장"
    creatorDepartment: Optional[str] = "미지정"
    creatorMatchCount: Optional[int] = 0


class RoomJoinRequest(BaseModel):
    """점심방 참여 요청"""
    userId: Optional[str] = None
    name: Optional[str] = "참여자"
    department: Optional[str] = "미지정"
    matchCount: Optional[int] = 0


class RoomLeaveRequest(BaseModel):
    """점심방 나가기 요청"""
    userId: str

