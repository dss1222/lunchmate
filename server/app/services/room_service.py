"""
점심방 서비스
점심방 관련 비즈니스 로직
"""
from typing import Optional, List
from datetime import datetime
from fastapi import HTTPException

from ..repositories import data_store
from ..core.utils import generate_id, get_recommended_restaurant


class RoomService:
    """점심방 관련 비즈니스 로직"""
    
    @staticmethod
    def get_all_rooms() -> List[dict]:
        """열린 점심방 + 매칭 완료된 방 목록 조회"""
        return data_store.get_all_active_rooms()
    
    @staticmethod
    def get_user_rooms(user_id: str) -> List[dict]:
        """특정 유저가 참여 중인 방 조회"""
        return data_store.get_user_rooms(user_id)
    
    @staticmethod
    def get_room(room_id: str) -> dict:
        """점심방 상세 조회"""
        room = data_store.get_room_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        return room
    
    @staticmethod
    def create_room(title: str, time_slot: str, menu: str, price_range: str,
                    max_count: int, creator_id: str, creator_name: str,
                    creator_department: str, creator_match_count: int = 0,
                    restaurant_info: dict = None) -> dict:
        """점심방 생성"""
        # 사용자가 선택한 식당이 있으면 그것을 사용, 없으면 None
        restaurant = restaurant_info if restaurant_info else None
        
        room = data_store.create_room({
            "title": title,
            "timeSlot": time_slot,
            "menu": menu,
            "priceRange": price_range,
            "maxCount": min(max(max_count, 2), 6),
            "members": [{
                "id": creator_id or generate_id(),
                "name": creator_name,
                "department": creator_department,
                "matchCount": creator_match_count,
                "isCreator": True,
            }],
            "restaurant": restaurant,
            "status": "open",
        })
        return room
    
    @staticmethod
    def join_room(room_id: str, user_id: str, name: str, department: str, match_count: int = 0) -> dict:
        """점심방 참여"""
        room = data_store.get_room_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        if len(room["members"]) >= room["maxCount"]:
            raise HTTPException(status_code=400, detail="Room is full")
        
        if any(m["id"] == user_id for m in room["members"]):
            raise HTTPException(status_code=400, detail="Already joined")
        
        room["members"].append({
            "id": user_id or generate_id(),
            "name": name,
            "department": department,
            "matchCount": match_count,
            "joinedAt": datetime.now().isoformat(),
        })
        
        # 방이 가득 찼으면 모든 멤버의 매칭 횟수 증가
        if len(room["members"]) >= room["maxCount"]:
            room["status"] = "full"
            # 모든 멤버의 매칭 횟수 증가
            for member in room["members"]:
                if member.get("id"):
                    data_store.increment_match_count(member["id"])
        
        return room
    
    @staticmethod
    def leave_room(room_id: str, user_id: str) -> dict:
        """점심방 나가기"""
        room = data_store.get_room_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        
        room["members"] = [m for m in room["members"] if m["id"] != user_id]
        
        if len(room["members"]) == 0:
            data_store.delete_room(room_id)
            return {"deleted": True}
        
        room["status"] = "open"
        return room

