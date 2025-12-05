"""
인메모리 데이터 저장소
실제 프로덕션에서는 이 부분을 DB로 교체
"""
from typing import Optional, List
from datetime import datetime
from ..core.utils import generate_id


class DataStore:
    """
    인메모리 데이터 저장소
    모든 데이터를 메모리에 저장합니다.
    """
    
    def __init__(self):
        self._users: List[dict] = []
        self._sessions: dict = {}  # token -> user_id
        self._waiting_users: List[dict] = []
        self._groups: List[dict] = []
        self._rooms: List[dict] = []
    
    # ============ 유저 관련 ============
    def get_all_users(self) -> List[dict]:
        """모든 유저 조회 (비밀번호 제외)"""
        return [
            {k: v for k, v in u.items() if k != "password"}
            for u in self._users
        ]
    
    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """ID로 유저 조회"""
        return next((u for u in self._users if u["id"] == user_id), None)
    
    def get_user_by_username(self, username: str) -> Optional[dict]:
        """username으로 유저 조회"""
        return next((u for u in self._users if u["username"] == username), None)
    
    def create_user(self, user_data: dict) -> dict:
        """새 유저 생성"""
        user = {
            "id": generate_id(),
            **user_data,
            "createdAt": datetime.now().isoformat(),
        }
        self._users.append(user)
        return user
    
    def user_exists(self, username: str) -> bool:
        """유저 존재 여부 확인"""
        return any(u["username"] == username for u in self._users)
    
    # ============ 세션 관련 ============
    def create_session(self, token: str, user_id: str):
        """세션 생성"""
        self._sessions[token] = user_id
    
    def get_session(self, token: str) -> Optional[str]:
        """세션에서 user_id 조회"""
        return self._sessions.get(token)
    
    def delete_session(self, token: str):
        """세션 삭제"""
        if token in self._sessions:
            del self._sessions[token]
    
    def delete_user_sessions(self, user_id: str):
        """특정 유저의 모든 세션 삭제"""
        tokens_to_delete = [t for t, uid in self._sessions.items() if uid == user_id]
        for token in tokens_to_delete:
            del self._sessions[token]
    
    # ============ 매칭 대기열 관련 ============
    def get_all_waiting_users(self) -> List[dict]:
        """모든 대기 유저 조회"""
        return self._waiting_users
    
    def get_waiting_user_by_id(self, request_id: str) -> Optional[dict]:
        """ID로 대기 유저 조회"""
        return next((u for u in self._waiting_users if u["id"] == request_id), None)
    
    def add_waiting_user(self, user_data: dict) -> dict:
        """대기열에 유저 추가"""
        self._waiting_users.append(user_data)
        return user_data
    
    def remove_waiting_user(self, request_id: str):
        """대기열에서 유저 제거"""
        self._waiting_users = [u for u in self._waiting_users if u["id"] != request_id]
    
    def remove_waiting_users(self, request_ids: List[str]):
        """대기열에서 여러 유저 제거"""
        self._waiting_users = [u for u in self._waiting_users if u["id"] not in request_ids]
    
    def remove_waiting_user_by_user_id(self, user_id: str):
        """userId로 대기열에서 유저 제거 (중복 참여 방지)"""
        self._waiting_users = [u for u in self._waiting_users if u.get("userId") != user_id]
    
    def get_waiting_user_by_user_id(self, user_id: str) -> Optional[dict]:
        """userId로 대기 유저 조회"""
        return next((u for u in self._waiting_users if u.get("userId") == user_id), None)
    
    def get_waiting_users_by_conditions(self, time_slot: str, price_range: str, menu: str) -> List[dict]:
        """조건에 맞는 대기 유저 조회"""
        return [
            u for u in self._waiting_users
            if u["timeSlot"] == time_slot
            and u["priceRange"] == price_range
            and u["menu"] == menu
        ]
    
    # ============ 그룹 관련 ============
    def get_all_groups(self) -> List[dict]:
        """모든 그룹 조회"""
        return self._groups
    
    def get_group_by_id(self, group_id: str) -> Optional[dict]:
        """ID로 그룹 조회"""
        return next((g for g in self._groups if g["id"] == group_id), None)
    
    def get_group_by_member_id(self, member_id: str) -> Optional[dict]:
        """멤버 ID로 그룹 조회"""
        for group in self._groups:
            if any(m["id"] == member_id for m in group["members"]):
                return group
        return None
    
    def create_group(self, group_data: dict) -> dict:
        """그룹 생성"""
        group = {
            "id": generate_id(),
            **group_data,
            "createdAt": datetime.now().isoformat(),
        }
        self._groups.append(group)
        return group
    
    # ============ 점심방 관련 ============
    def get_all_rooms(self) -> List[dict]:
        """모든 점심방 조회"""
        return self._rooms
    
    def get_open_rooms(self) -> List[dict]:
        """열린 점심방만 조회"""
        return [
            r for r in self._rooms
            if len(r["members"]) < r["maxCount"] and r["status"] == "open"
        ]
    
    def get_room_by_id(self, room_id: str) -> Optional[dict]:
        """ID로 점심방 조회"""
        return next((r for r in self._rooms if r["id"] == room_id), None)
    
    def create_room(self, room_data: dict) -> dict:
        """점심방 생성"""
        room = {
            "id": generate_id(),
            **room_data,
            "createdAt": datetime.now().isoformat(),
        }
        self._rooms.append(room)
        return room
    
    def update_room(self, room_id: str, updates: dict) -> Optional[dict]:
        """점심방 업데이트"""
        room = self.get_room_by_id(room_id)
        if room:
            room.update(updates)
        return room
    
    def delete_room(self, room_id: str):
        """점심방 삭제"""
        self._rooms = [r for r in self._rooms if r["id"] != room_id]
    
    # ============ 통계 관련 ============
    def get_stats(self) -> dict:
        """통계 데이터 조회"""
        all_participants = self._waiting_users + [
            m for g in self._groups for m in g["members"]
        ]
        
        menu_stats = {}
        time_stats = {}
        for u in all_participants:
            if u.get("menu"):
                menu_stats[u["menu"]] = menu_stats.get(u["menu"], 0) + 1
            if u.get("timeSlot"):
                time_stats[u["timeSlot"]] = time_stats.get(u["timeSlot"], 0) + 1
        
        return {
            "totalParticipants": len(all_participants),
            "waitingUsers": len(self._waiting_users),
            "totalGroups": len(self._groups),
            "totalRooms": len(self._rooms),
            "menuStats": menu_stats,
            "timeStats": time_stats,
        }

