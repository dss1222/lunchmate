"""
유저 API 라우터
유저 조회 관련 엔드포인트
"""
from fastapi import APIRouter, HTTPException

from ..repositories import data_store

router = APIRouter(prefix="/users", tags=["유저"])


@router.get("")
def get_users():
    """모든 유저 목록"""
    return data_store.get_all_users()


@router.get("/{user_id}")
def get_user(user_id: str):
    """유저 상세"""
    user = data_store.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {k: v for k, v in user.items() if k != "password"}

