"""
식당 API 라우터
식당 조회 관련 엔드포인트
"""
import random
from fastapi import APIRouter

from ..core.config import RESTAURANTS

router = APIRouter(prefix="/restaurants", tags=["식당"])


@router.get("")
def get_restaurants(menu: str = None, priceRange: str = None):
    """식당 목록"""
    filtered = RESTAURANTS
    if menu:
        filtered = [r for r in filtered if r["type"] == menu]
    if priceRange:
        filtered = [r for r in filtered if r["price"] == priceRange]
    return filtered


@router.get("/random")
def get_random_restaurant(menu: str = None, priceRange: str = None):
    """랜덤 식당 추천"""
    filtered = RESTAURANTS
    if menu:
        filtered = [r for r in filtered if r["type"] == menu]
    if priceRange:
        filtered = [r for r in filtered if r["price"] == priceRange]
    if not filtered:
        filtered = RESTAURANTS
    return random.choice(filtered)

