"""
식당 API 라우터
식당 조회 관련 엔드포인트
"""
import random
import httpx
from fastapi import APIRouter, HTTPException

from ..core.config import RESTAURANTS, KAKAO_REST_API_KEY

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


# ============ 카카오 맛집 검색 API ============

@router.get("/nearby")
async def get_nearby_restaurants(
    latitude: float = 37.530230,
    longitude: float = 126.926439,
    keyword: str = "맛집",
    radius: int = 1000,
    page: int = 1,
    size: int = 15
):
    """
    카카오 API를 사용하여 주변 맛집 검색 (기본: 여의도)
    """
    if not KAKAO_REST_API_KEY:
        raise HTTPException(
            status_code=500, 
            detail="카카오 API 키가 설정되지 않았습니다."
        )
    
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"}
    params = {
        "query": keyword,
        "x": str(longitude),
        "y": str(latitude),
        "radius": min(radius, 20000),
        "page": page,
        "size": min(size, 15),
        "sort": "distance",
        "category_group_code": "FD6"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"카카오 API 오류: {response.text}"
            )
        
        data = response.json()
    
    restaurants_list = []
    for place in data.get("documents", []):
        restaurants_list.append({
            "id": place.get("id"),
            "name": place.get("place_name"),
            "category": place.get("category_name"),
            "phone": place.get("phone"),
            "address": place.get("address_name"),
            "roadAddress": place.get("road_address_name"),
            "latitude": float(place.get("y")),
            "longitude": float(place.get("x")),
            "distance": int(place.get("distance", 0)),
            "placeUrl": place.get("place_url"),
        })
    
    return {
        "restaurants": restaurants_list,
        "meta": {
            "totalCount": data.get("meta", {}).get("total_count", 0),
            "pageableCount": data.get("meta", {}).get("pageable_count", 0),
            "isEnd": data.get("meta", {}).get("is_end", True),
            "currentPage": page,
        }
    }

