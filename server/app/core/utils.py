"""
유틸리티 함수들
"""
import hashlib
import uuid
import random
from .config import LEVEL_GROUPS, RESTAURANTS


def hash_password(password: str) -> str:
    """비밀번호 해시"""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_token() -> str:
    """세션 토큰 생성"""
    return str(uuid.uuid4())


def generate_id() -> str:
    """UUID 생성"""
    return str(uuid.uuid4())


def get_similar_levels(level: str) -> list:
    """해당 직급과 비슷한 직급들 반환"""
    for group in LEVEL_GROUPS:
        if level in group:
            return group
    return [level]


def is_similar_age(age1: int, age2: int, threshold: int = 5) -> bool:
    """나이가 ±threshold 이내인지 확인"""
    return abs(age1 - age2) <= threshold


def is_similar_level(level1: str, level2: str) -> bool:
    """직급이 비슷한지 확인"""
    similar_levels = get_similar_levels(level1)
    return level2 in similar_levels


def get_recommended_restaurant(menu: str, price_range: str = None) -> dict:
    """조건에 맞는 추천 식당 1개 반환"""
    filtered = [r for r in RESTAURANTS if r["type"] == menu]
    if price_range:
        price_filtered = [r for r in filtered if r["price"] == price_range]
        if price_filtered:
            filtered = price_filtered
    if not filtered:
        filtered = RESTAURANTS
    return random.choice(filtered)


def get_recommended_restaurants(menu: str, price_range: str = None, count: int = 3) -> list:
    """조건에 맞는 추천 식당 여러 개 반환"""
    filtered = [r for r in RESTAURANTS if r["type"] == menu]
    if price_range:
        price_filtered = [r for r in filtered if r["price"] == price_range]
        if price_filtered:
            filtered = price_filtered
    if not filtered:
        filtered = RESTAURANTS
    random.shuffle(filtered)
    return filtered[:count]

