"""
매칭 API 라우터
점심 매칭 관련 엔드포인트
"""
from fastapi import APIRouter, Query

from ..schemas import MatchJoinRequest, MatchCancelRequest
from ..services import MatchService

router = APIRouter(prefix="/match", tags=["매칭"])


@router.post("/join")
def join_match(request: MatchJoinRequest):
    """매칭 참여"""
    return MatchService.join_match(
        user_id=request.userId,
        name=request.name,
        department=request.department,
        gender=request.gender,
        age=request.age,
        level=request.level,
        time_slot=request.timeSlot,
        price_range=request.priceRange,
        menu=request.menu,
        preferences=request.preferences.dict() if request.preferences else None,
    )


@router.get("/status")
def get_match_status(
    matchRequestId: str = Query(...),
    elapsedSeconds: int = Query(0)
):
    """매칭 상태 확인 (점진적 조건 완화)"""
    return MatchService.get_match_status(
        match_request_id=matchRequestId,
        elapsed_seconds=elapsedSeconds,
    )


@router.delete("/cancel")
def cancel_match(request: MatchCancelRequest):
    """매칭 취소"""
    return MatchService.cancel_match(request.matchRequestId)


@router.get("/active/{user_id}")
def get_active_status(user_id: str):
    """현재 활성 상태 확인 (매칭 대기/방 참여/그룹 참여)"""
    return MatchService.get_user_active_status(user_id)

