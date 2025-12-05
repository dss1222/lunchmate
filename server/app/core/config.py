"""
애플리케이션 설정
"""

# 직급 그룹 정의
LEVEL_GROUPS = [
    ['intern', 'staff', 'assistant'],      # 인턴, 사원, 대리
    ['staff', 'assistant', 'manager'],     # 사원, 대리, 과장
    ['assistant', 'manager', 'deputy'],    # 대리, 과장, 차장
    ['manager', 'deputy', 'general'],      # 과장, 차장, 부장
    ['deputy', 'general', 'director'],     # 차장, 부장, 이사
]

# 매칭 설정
MATCHING_TIMEOUT_SECONDS = 300  # 5분
RELAXATION_INTERVAL_SECONDS = 60  # 1분마다 조건 완화
MAX_GROUP_SIZE = 4

# 샘플 식당 데이터
RESTAURANTS = [
    {"id": "r1", "name": "김밥천국", "type": "korean", "price": "low", "distance": 3, "rating": 4.2},
    {"id": "r2", "name": "한솥도시락", "type": "korean", "price": "low", "distance": 4, "rating": 4.0},
    {"id": "r3", "name": "백반의민족", "type": "korean", "price": "mid", "distance": 5, "rating": 4.5},
    {"id": "r4", "name": "스시로", "type": "japanese", "price": "mid", "distance": 6, "rating": 4.3},
    {"id": "r5", "name": "이자카야 하나", "type": "japanese", "price": "high", "distance": 8, "rating": 4.6},
    {"id": "r6", "name": "짬뽕지존", "type": "chinese", "price": "mid", "distance": 4, "rating": 4.1},
    {"id": "r7", "name": "딤섬하우스", "type": "chinese", "price": "high", "distance": 10, "rating": 4.7},
    {"id": "r8", "name": "샐러디", "type": "salad", "price": "mid", "distance": 3, "rating": 4.4},
    {"id": "r9", "name": "써브웨이", "type": "salad", "price": "low", "distance": 2, "rating": 4.0},
    {"id": "r10", "name": "떡볶이천국", "type": "snack", "price": "low", "distance": 3, "rating": 4.2},
    {"id": "r11", "name": "피자헛", "type": "western", "price": "mid", "distance": 7, "rating": 4.0},
    {"id": "r12", "name": "파스타앤코", "type": "western", "price": "high", "distance": 9, "rating": 4.5},
]

