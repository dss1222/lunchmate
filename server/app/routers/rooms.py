"""
점심방 API 라우터
점심방 CRUD 관련 엔드포인트
"""
from fastapi import APIRouter

from ..schemas import RoomCreateRequest, RoomJoinRequest, RoomLeaveRequest
from ..services import RoomService

router = APIRouter(prefix="/rooms", tags=["점심방"])


@router.get("")
def get_rooms():
    """열린 점심방 + 매칭 완료된 방 목록"""
    return RoomService.get_all_rooms()


@router.get("/my/{user_id}")
def get_my_rooms(user_id: str):
    """내가 참여 중인 방 목록"""
    return RoomService.get_user_rooms(user_id)


@router.get("/{room_id}")
def get_room(room_id: str):
    """점심방 상세"""
    return RoomService.get_room(room_id)


@router.post("")
def create_room(request: RoomCreateRequest):
    """점심방 생성"""
    return RoomService.create_room(
        title=request.title,
        time_slot=request.timeSlot,
        menu=request.menu,
        price_range=request.priceRange,
        max_count=request.maxCount,
        creator_id=request.creatorId,
        creator_name=request.creatorName,
        creator_department=request.creatorDepartment,
        creator_match_count=request.creatorMatchCount,
        restaurant_info=request.restaurantInfo.model_dump() if request.restaurantInfo else None,
    )


@router.post("/{room_id}/join")
def join_room(room_id: str, request: RoomJoinRequest):
    """점심방 참여"""
    return RoomService.join_room(
        room_id=room_id,
        user_id=request.userId,
        name=request.name,
        department=request.department,
        match_count=request.matchCount,
    )


@router.post("/{room_id}/leave")
def leave_room(room_id: str, request: RoomLeaveRequest):
    """점심방 나가기"""
    return RoomService.leave_room(
        room_id=room_id,
        user_id=request.userId,
    )

