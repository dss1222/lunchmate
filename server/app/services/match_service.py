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
    def find_matching_users(requester: dict, relaxation_level: int = 0) -> List[dict]:
        """
        조건에 맞는 매칭 대상 찾기
        relaxation_level: 0 = 모든 조건, 1+ = 조건 완화 단계
        """
        preferences = requester.get("preferences", {})
        
        # 선택된 조건 순서 결정
        active_conditions = []
        if preferences.get("sameGender"):
            active_conditions.append("gender")
        if preferences.get("similarAge"):
            active_conditions.append("age")
        if preferences.get("sameLevel"):
            active_conditions.append("level")
        
        # relaxation_level에 따라 조건 완화
        relaxed_conditions = active_conditions[relaxation_level:] if relaxation_level < len(active_conditions) else []
        
        matching_users = []
        all_waiting = data_store.get_all_waiting_users()
        
        for u in all_waiting:
            if u["id"] == requester["id"]:
                continue
            
            # 기본 조건: 시간, 가격대, 메뉴
            if u["timeSlot"] != requester["timeSlot"]:
                continue
            if u["priceRange"] != requester["priceRange"]:
                continue
            if u["menu"] != requester["menu"]:
                continue
            
            # 선호 조건 체크
            match = True
            
            if "gender" in relaxed_conditions and requester.get("gender") and u.get("gender"):
                if requester["gender"] != u["gender"]:
                    match = False
            
            if "age" in relaxed_conditions and requester.get("age") and u.get("age"):
                if not is_similar_age(requester["age"], u["age"]):
                    match = False
            
            if "level" in relaxed_conditions and requester.get("level") and u.get("level"):
                if not is_similar_level(requester["level"], u["level"]):
                    match = False
            
            if match:
                matching_users.append(u)
        
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
        
        # 대기 중 (자기 자신은 제외한 카운트)
        all_waiting = data_store.get_waiting_users_by_conditions(
            in_waiting["timeSlot"], in_waiting["priceRange"], in_waiting["menu"]
        )
        # 자기 자신 제외
        waiting_count = len([u for u in all_waiting if u["id"] != match_request_id])
        
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

