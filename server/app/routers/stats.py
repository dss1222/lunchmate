"""
통계 API 라우터
통계 데이터 관련 엔드포인트
"""
from fastapi import APIRouter

from ..repositories import data_store
from ..core.utils import get_recommended_restaurants

router = APIRouter(tags=["통계"])


@router.get("/stats")
def get_stats():
    """오늘의 통계"""
    return data_store.get_stats()


@router.get("/groups")
def get_groups():
    """모든 그룹 목록"""
    return data_store.get_all_groups()


@router.get("/groups/{group_id}")
def get_group(group_id: str):
    """그룹 상세"""
    from fastapi import HTTPException
    
    group = data_store.get_group_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return {
        **group,
        "recommendedRestaurants": get_recommended_restaurants(
            group["menu"], group["priceRange"], 3
        ),
    }

