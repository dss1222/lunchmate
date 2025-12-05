"""
점심방 관련 스키마
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any


class RestaurantInfo(BaseModel):
    """선택한 식당 정보"""
    id: Optional[str] = None
    name: str
    category: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    placeUrl: Optional[str] = None
    distance: Optional[int] = None


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
    restaurantInfo: Optional[RestaurantInfo] = None


class RoomJoinRequest(BaseModel):
    """점심방 참여 요청"""
    userId: Optional[str] = None
    name: Optional[str] = "참여자"
    department: Optional[str] = "미지정"
    matchCount: Optional[int] = 0


class RoomLeaveRequest(BaseModel):
    """점심방 나가기 요청"""
    userId: str

