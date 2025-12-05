from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
import random

app = FastAPI(
    title="🍱 LunchMate API",
    description="혼밥 탈출! 점심 매칭 서비스",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ In-Memory 데이터 저장소 ============
waiting_users: list = []
groups: list = []
rooms: list = []

# 샘플 식당 데이터
restaurants = [
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

# 샘플 유저 데이터
users = [
    {"id": "demo1", "name": "김철수", "department": "AI팀", "gender": "male", "age": 28, "level": "junior"},
    {"id": "demo2", "name": "이영희", "department": "개발팀", "gender": "female", "age": 32, "level": "senior"},
    {"id": "demo3", "name": "박지민", "department": "디자인팀", "gender": "female", "age": 26, "level": "junior"},
    {"id": "demo4", "name": "최동욱", "department": "마케팅팀", "gender": "male", "age": 35, "level": "manager"},
    {"id": "demo5", "name": "정수현", "department": "컨설팅팀", "gender": "female", "age": 29, "level": "senior"},
]

# ============ Pydantic 모델 ============
class Preferences(BaseModel):
    similarAge: bool = False
    sameGender: bool = False
    sameLevel: bool = False

class MatchJoinRequest(BaseModel):
    userId: Optional[str] = None
    name: Optional[str] = "익명"
    department: Optional[str] = "미지정"
    timeSlot: str
    priceRange: str
    menu: str
    preferences: Optional[Preferences] = None

class MatchCancelRequest(BaseModel):
    matchRequestId: str

class RoomCreateRequest(BaseModel):
    title: str
    timeSlot: str
    menu: str
    priceRange: Optional[str] = "mid"
    maxCount: int
    creatorId: Optional[str] = None
    creatorName: Optional[str] = "방장"
    creatorDepartment: Optional[str] = "미지정"

class RoomJoinRequest(BaseModel):
    userId: Optional[str] = None
    name: Optional[str] = "참여자"
    department: Optional[str] = "미지정"

class RoomLeaveRequest(BaseModel):
    userId: str

# ============ 헬퍼 함수 ============
def get_recommended_restaurant(menu: str, price_range: str = None):
    filtered = [r for r in restaurants if r["type"] == menu]
    if price_range:
        price_filtered = [r for r in filtered if r["price"] == price_range]
        if price_filtered:
            filtered = price_filtered
    if not filtered:
        filtered = restaurants
    return random.choice(filtered)

def get_recommended_restaurants(menu: str, price_range: str = None, count: int = 3):
    filtered = [r for r in restaurants if r["type"] == menu]
    if price_range:
        price_filtered = [r for r in filtered if r["price"] == price_range]
        if price_filtered:
            filtered = price_filtered
    if not filtered:
        filtered = restaurants
    random.shuffle(filtered)
    return filtered[:count]

# ============ API 엔드포인트 ============

@app.get("/health")
def health_check():
    """서버 상태 확인"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/stats")
def get_stats():
    """오늘의 통계"""
    all_participants = waiting_users + [m for g in groups for m in g["members"]]
    
    menu_stats = {}
    time_stats = {}
    for u in all_participants:
        if u.get("menu"):
            menu_stats[u["menu"]] = menu_stats.get(u["menu"], 0) + 1
        if u.get("timeSlot"):
            time_stats[u["timeSlot"]] = time_stats.get(u["timeSlot"], 0) + 1
    
    return {
        "totalParticipants": len(all_participants),
        "waitingUsers": len(waiting_users),
        "totalGroups": len(groups),
        "totalRooms": len(rooms),
        "menuStats": menu_stats,
        "timeStats": time_stats,
    }

# ============ 유저 API ============
@app.get("/users")
def get_users():
    """모든 유저 목록"""
    return users

@app.get("/users/{user_id}")
def get_user(user_id: str):
    """유저 상세"""
    user = next((u for u in users if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ============ 매칭 API ============
@app.post("/match/join")
def join_match(request: MatchJoinRequest):
    """매칭 참여"""
    global waiting_users, groups
    
    match_request = {
        "id": str(uuid.uuid4()),
        "userId": request.userId or str(uuid.uuid4()),
        "name": request.name,
        "department": request.department,
        "timeSlot": request.timeSlot,
        "priceRange": request.priceRange,
        "menu": request.menu,
        "preferences": request.preferences.dict() if request.preferences else {},
        "joinedAt": datetime.now().isoformat(),
    }
    
    # 같은 조건의 대기자 찾기
    matching_users = [
        u for u in waiting_users 
        if u["timeSlot"] == request.timeSlot 
        and u["priceRange"] == request.priceRange 
        and u["menu"] == request.menu
    ]
    
    # 2명 이상이면 매칭 성공
    if len(matching_users) >= 1:
        group_members = [match_request] + matching_users[:3]  # 최대 4명
        
        # 대기열에서 제거
        for m in group_members:
            waiting_users = [u for u in waiting_users if u["id"] != m["id"]]
        
        # 그룹 생성
        group = {
            "id": str(uuid.uuid4()),
            "members": group_members,
            "timeSlot": request.timeSlot,
            "priceRange": request.priceRange,
            "menu": request.menu,
            "createdAt": datetime.now().isoformat(),
            "restaurant": get_recommended_restaurant(request.menu, request.priceRange),
        }
        groups.append(group)
        
        return {
            "status": "matched",
            "groupId": group["id"],
            "matchRequest": match_request,
        }
    
    # 대기열에 추가
    waiting_users.append(match_request)
    
    return {
        "status": "waiting",
        "matchRequestId": match_request["id"],
        "userId": match_request["userId"],
        "waitingCount": len([u for u in waiting_users 
            if u["timeSlot"] == request.timeSlot 
            and u["priceRange"] == request.priceRange 
            and u["menu"] == request.menu
        ]),
    }

@app.get("/match/status")
def get_match_status(matchRequestId: str = Query(...)):
    """매칭 상태 확인"""
    # 대기열 확인
    in_waiting = next((u for u in waiting_users if u["id"] == matchRequestId), None)
    if in_waiting:
        return {
            "status": "waiting",
            "waitingCount": len([u for u in waiting_users 
                if u["timeSlot"] == in_waiting["timeSlot"]
                and u["priceRange"] == in_waiting["priceRange"]
                and u["menu"] == in_waiting["menu"]
            ]),
        }
    
    # 그룹 확인
    for group in groups:
        if any(m["id"] == matchRequestId for m in group["members"]):
            return {"status": "matched", "groupId": group["id"]}
    
    return {"status": "not_found"}

@app.delete("/match/cancel")
def cancel_match(request: MatchCancelRequest):
    """매칭 취소"""
    global waiting_users
    waiting_users = [u for u in waiting_users if u["id"] != request.matchRequestId]
    return {"success": True}

# ============ 그룹 API ============
@app.get("/groups")
def get_groups():
    """모든 그룹 목록"""
    return groups

@app.get("/groups/{group_id}")
def get_group(group_id: str):
    """그룹 상세"""
    group = next((g for g in groups if g["id"] == group_id), None)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return {
        **group,
        "recommendedRestaurants": get_recommended_restaurants(group["menu"], group["priceRange"], 3),
    }

# ============ 점심방 API ============
@app.get("/rooms")
def get_rooms():
    """열린 점심방 목록"""
    return [r for r in rooms if len(r["members"]) < r["maxCount"] and r["status"] == "open"]

@app.get("/rooms/{room_id}")
def get_room(room_id: str):
    """점심방 상세"""
    room = next((r for r in rooms if r["id"] == room_id), None)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@app.post("/rooms")
def create_room(request: RoomCreateRequest):
    """점심방 생성"""
    room = {
        "id": str(uuid.uuid4()),
        "title": request.title,
        "timeSlot": request.timeSlot,
        "menu": request.menu,
        "priceRange": request.priceRange,
        "maxCount": min(max(request.maxCount, 2), 6),
        "members": [{
            "id": request.creatorId or str(uuid.uuid4()),
            "name": request.creatorName,
            "department": request.creatorDepartment,
            "isCreator": True,
        }],
        "restaurant": get_recommended_restaurant(request.menu, request.priceRange),
        "status": "open",
        "createdAt": datetime.now().isoformat(),
    }
    rooms.append(room)
    return room

@app.post("/rooms/{room_id}/join")
def join_room(room_id: str, request: RoomJoinRequest):
    """점심방 참여"""
    room = next((r for r in rooms if r["id"] == room_id), None)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if len(room["members"]) >= room["maxCount"]:
        raise HTTPException(status_code=400, detail="Room is full")
    
    if any(m["id"] == request.userId for m in room["members"]):
        raise HTTPException(status_code=400, detail="Already joined")
    
    room["members"].append({
        "id": request.userId or str(uuid.uuid4()),
        "name": request.name,
        "department": request.department,
        "joinedAt": datetime.now().isoformat(),
    })
    
    if len(room["members"]) >= room["maxCount"]:
        room["status"] = "full"
    
    return room

@app.post("/rooms/{room_id}/leave")
def leave_room(room_id: str, request: RoomLeaveRequest):
    """점심방 나가기"""
    global rooms
    room = next((r for r in rooms if r["id"] == room_id), None)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room["members"] = [m for m in room["members"] if m["id"] != request.userId]
    
    if len(room["members"]) == 0:
        rooms = [r for r in rooms if r["id"] != room_id]
        return {"deleted": True}
    
    room["status"] = "open"
    return room

# ============ 식당 API ============
@app.get("/restaurants")
def get_restaurants(menu: str = None, priceRange: str = None):
    """식당 목록"""
    filtered = restaurants
    if menu:
        filtered = [r for r in filtered if r["type"] == menu]
    if priceRange:
        filtered = [r for r in filtered if r["price"] == priceRange]
    return filtered

@app.get("/restaurants/random")
def get_random_restaurant(menu: str = None, priceRange: str = None):
    """랜덤 식당 추천"""
    filtered = restaurants
    if menu:
        filtered = [r for r in filtered if r["type"] == menu]
    if priceRange:
        filtered = [r for r in filtered if r["price"] == priceRange]
    if not filtered:
        filtered = restaurants
    return random.choice(filtered)

# ============ 서버 실행 ============
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)

