"""
매칭 서비스
점심 매칭 관련 비즈니스 로직
"""
from typing import Optional, List
from datetime import datetime

from ..repositories import data_store
from ..core.utils import generate_id, is_similar_age, is_similar_level, get_recommended_restaurant
from ..core.config import MATCHING_TIMEOUT_SECONDS, RELAXATION_INTERVAL_SECONDS, MAX_GROUP_SIZE


class MatchService:
    """매칭 관련 비즈니스 로직"""
    
    @staticmethod
    def get_elapsed_seconds(joined_at: str) -> int:
        """joinedAt 시간으로부터 경과 시간(초) 계산"""
        try:
            joined_time = datetime.fromisoformat(joined_at)
            elapsed = (datetime.now() - joined_time).total_seconds()
            return max(0, int(elapsed))
        except:
            return 0
    
    @staticmethod
    def get_relaxation_level_from_elapsed(elapsed_seconds: int) -> int:
        """경과 시간으로 relaxation level 계산"""
        return min(elapsed_seconds // RELAXATION_INTERVAL_SECONDS, 3)
    
    @staticmethod
    def check_one_way_match(checker: dict, target: dict, checker_relaxation: int) -> bool:
        """
        단방향 조건 체크: checker가 target을 원하는가?
        checker의 preferences와 relaxation_level로 target을 체크
        """
        preferences = checker.get("preferences", {})
        
        # 조건이 없으면 무조건 OK
        if not preferences:
            return True
        
        # 선택된 조건 순서 결정
        active_conditions = []
        if preferences.get("sameGender"):
            active_conditions.append("gender")
        if preferences.get("similarAge"):
            active_conditions.append("age")
        if preferences.get("sameLevel"):
            active_conditions.append("level")
        
        # 조건이 없으면 OK
        if not active_conditions:
            return True
        
        # relaxation_level에 따라 남은 조건 (완화되지 않은 조건)
        remaining_conditions = active_conditions[checker_relaxation:] if checker_relaxation < len(active_conditions) else []
        
        # 남은 조건 체크
        for cond in remaining_conditions:
            if cond == "gender":
                if checker.get("gender") and target.get("gender"):
                    if checker["gender"] != target["gender"]:
                        return False
            elif cond == "age":
                if checker.get("age") and target.get("age"):
                    if not is_similar_age(checker["age"], target["age"]):
                        return False
            elif cond == "level":
                if checker.get("level") and target.get("level"):
                    if not is_similar_level(checker["level"], target["level"]):
                        return False
        
        return True
    
    @staticmethod
    def check_mutual_match(user_a: dict, user_b: dict, a_relaxation: int, b_relaxation: int) -> bool:
        """
        양방향 조건 체크: 두 사용자가 서로를 원하는가?
        A가 B를 원하고 AND B가 A를 원해야 함
        """
        a_wants_b = MatchService.check_one_way_match(user_a, user_b, a_relaxation)
        b_wants_a = MatchService.check_one_way_match(user_b, user_a, b_relaxation)
        return a_wants_b and b_wants_a
    
    @staticmethod
    def find_matching_users(requester: dict, relaxation_level: int = 0) -> List[dict]:
        """
        조건에 맞는 매칭 대상 찾기 (양방향 체크)
        - requester가 candidate를 원하는가? (requester의 조건)
        - candidate가 requester를 원하는가? (candidate의 조건)
        """
        matching_users = []
        all_waiting = data_store.get_all_waiting_users()
        
        for candidate in all_waiting:
            if candidate["id"] == requester["id"]:
                continue
            
            # 기본 조건: 시간, 가격대, 메뉴 (필수)
            if candidate["timeSlot"] != requester["timeSlot"]:
                continue
            if candidate["priceRange"] != requester["priceRange"]:
                continue
            if candidate["menu"] != requester["menu"]:
                continue
            
            # candidate의 경과 시간으로 relaxation level 계산
            candidate_elapsed = MatchService.get_elapsed_seconds(candidate.get("joinedAt", ""))
            candidate_relaxation = MatchService.get_relaxation_level_from_elapsed(candidate_elapsed)
            
            # 양방향 조건 체크
            if MatchService.check_mutual_match(requester, candidate, relaxation_level, candidate_relaxation):
                matching_users.append(candidate)
        
        return matching_users
    
    @staticmethod
    def get_relaxation_message(relaxation_level: int, preferences: dict) -> Optional[str]:
        """현재 완화 단계에 대한 메시지 반환"""
        active_conditions = []
        if preferences.get("sameGender"):
            active_conditions.append("gender")
        if preferences.get("similarAge"):
            active_conditions.append("age")
        if preferences.get("sameLevel"):
            active_conditions.append("level")
        
        if relaxation_level == 0 or relaxation_level >= len(active_conditions):
            return None
        
        relaxed = active_conditions[:relaxation_level]
        messages = []
        for cond in relaxed:
            if cond == "gender":
                messages.append("다른 성별을 포함하여")
            elif cond == "age":
                messages.append("다른 나이대를 포함하여")
            elif cond == "level":
                messages.append("다른 직급을 포함하여")
        
        if messages:
            return f"매치를 찾지 못했습니다. {' '.join(messages)} 매치합니다."
        return None
    
    @staticmethod
    def join_match(user_id: str, name: str, department: str, gender: str,
                   age: int, level: str, time_slot: str, price_range: str,
                   menu: str, preferences: dict) -> dict:
        """매칭 참여"""
        
        # 이미 참여 중인 점심 활동이 있는지 확인 (방 또는 완료된 그룹)
        if user_id:
            active_room = data_store.get_user_active_room(user_id)
            if active_room:
                return {
                    "status": "already_active",
                    "message": "이미 점심방에 참여 중입니다. 먼저 나가기를 해주세요.",
                    "activeType": "room",
                    "activeId": active_room["id"],
                }
            
            active_group = data_store.get_user_active_group(user_id)
            if active_group:
                return {
                    "status": "already_active",
                    "message": "이미 매칭이 완료된 그룹이 있습니다.",
                    "activeType": "group",
                    "activeId": active_group["id"],
                }
        
        # 동일 userId의 기존 매칭 요청 제거 (중복 참여 방지)
        if user_id:
            data_store.remove_waiting_user_by_user_id(user_id)
        
        match_request = {
            "id": generate_id(),
            "userId": user_id or generate_id(),
            "name": name,
            "department": department,
            "gender": gender,
            "age": age,
            "level": level,
            "timeSlot": time_slot,
            "priceRange": price_range,
            "menu": menu,
            "preferences": preferences or {},
            "joinedAt": datetime.now().isoformat(),
            "relaxationLevel": 0,
        }
        
        # 모든 조건으로 매칭 시도
        matching_users = MatchService.find_matching_users(match_request, relaxation_level=0)
        
        # 매칭 성공
        if len(matching_users) >= 1:
            group_members = [match_request] + matching_users[:MAX_GROUP_SIZE - 1]
            member_ids = [m["id"] for m in group_members]
            
            # 대기열에서 제거
            data_store.remove_waiting_users(member_ids)
            
            # 각 멤버의 매칭 횟수 증가
            for member in group_members:
                if member.get("userId"):
                    data_store.increment_match_count(member["userId"])
            
            # 그룹 생성
            group = data_store.create_group({
                "members": group_members,
                "timeSlot": time_slot,
                "priceRange": price_range,
                "menu": menu,
                "restaurant": get_recommended_restaurant(menu, price_range),
            })
            
            return {
                "status": "matched",
                "groupId": group["id"],
                "matchRequest": match_request,
            }
        
        # 대기열에 추가
        data_store.add_waiting_user(match_request)
        
        waiting_count = len(data_store.get_waiting_users_by_conditions(
            time_slot, price_range, menu
        ))
        
        return {
            "status": "waiting",
            "matchRequestId": match_request["id"],
            "userId": match_request["userId"],
            "waitingCount": waiting_count,
            "relaxationLevel": 0,
            "relaxationMessage": None,
        }
    
    @staticmethod
    def get_match_status(match_request_id: str, elapsed_seconds: int = 0) -> dict:
        """매칭 상태 확인 (점진적 조건 완화)"""
        
        # 그룹에서 이미 매칭됐는지 확인
        group = data_store.get_group_by_member_id(match_request_id)
        if group:
            return {"status": "matched", "groupId": group["id"]}
        
        # 대기열 확인
        in_waiting = data_store.get_waiting_user_by_id(match_request_id)
        if not in_waiting:
            return {"status": "not_found"}
        
        # 경과 시간에 따른 완화 단계 계산
        relaxation_level = min(elapsed_seconds // RELAXATION_INTERVAL_SECONDS, 3)
        
        # 현재 완화 단계로 매칭 시도
        matching_users = MatchService.find_matching_users(in_waiting, relaxation_level)
        
        # 매칭 성공
        if len(matching_users) >= 1:
            group_members = [in_waiting] + matching_users[:MAX_GROUP_SIZE - 1]
            member_ids = [m["id"] for m in group_members]
            
            # 대기열에서 제거
            data_store.remove_waiting_users(member_ids)
            
            # 각 멤버의 매칭 횟수 증가
            for member in group_members:
                if member.get("userId"):
                    data_store.increment_match_count(member["userId"])
            
            # 그룹 생성
            group = data_store.create_group({
                "members": group_members,
                "timeSlot": in_waiting["timeSlot"],
                "priceRange": in_waiting["priceRange"],
                "menu": in_waiting["menu"],
                "restaurant": get_recommended_restaurant(in_waiting["menu"], in_waiting["priceRange"]),
                "relaxationApplied": relaxation_level > 0,
            })
            
            return {
                "status": "matched",
                "groupId": group["id"],
                "relaxationLevel": relaxation_level,
            }
        
        # 완화 메시지 생성
        preferences = in_waiting.get("preferences", {})
        relaxation_message = MatchService.get_relaxation_message(relaxation_level, preferences)
        
        # 타임아웃 체크
        if elapsed_seconds >= MATCHING_TIMEOUT_SECONDS:
            return {
                "status": "timeout",
                "relaxationLevel": relaxation_level,
                "relaxationMessage": "매칭 시간이 초과되었습니다.",
            }
        
        # 대기 중인 전체 인원 (나 포함)
        all_waiting = data_store.get_waiting_users_by_conditions(
            in_waiting["timeSlot"], in_waiting["priceRange"], in_waiting["menu"]
        )
        waiting_count = len(all_waiting)  # 나 포함 전체 인원
        
        return {
            "status": "waiting",
            "waitingCount": waiting_count,
            "relaxationLevel": relaxation_level,
            "relaxationMessage": relaxation_message,
            "elapsedSeconds": elapsed_seconds,
        }
    
    @staticmethod
    def cancel_match(match_request_id: str) -> dict:
        """매칭 취소"""
        data_store.remove_waiting_user(match_request_id)
        return {"success": True}
    
    @staticmethod
    def get_user_active_status(user_id: str) -> dict:
        """사용자의 현재 활성 상태 확인"""
        # 매칭 대기 중인지 확인
        waiting = data_store.get_waiting_user_by_user_id(user_id)
        if waiting:
            return {
                "active": True,
                "type": "waiting",
                "data": {
                    "matchRequestId": waiting["id"],
                    "timeSlot": waiting.get("timeSlot"),
                    "menu": waiting.get("menu"),
                    "priceRange": waiting.get("priceRange"),
                    "joinedAt": waiting.get("joinedAt"),
                }
            }
        
        # 오늘 참여 중인 방이 있는지 확인
        active_room = data_store.get_user_active_room(user_id)
        if active_room:
            return {
                "active": True,
                "type": "room",
                "data": active_room
            }
        
        # 오늘 매칭된 그룹이 있는지 확인
        active_group = data_store.get_user_active_group(user_id)
        if active_group:
            return {
                "active": True,
                "type": "group",
                "data": active_group
            }
        
        return {"active": False, "type": None, "data": None}

