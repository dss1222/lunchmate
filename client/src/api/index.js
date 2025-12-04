const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 통계
export async function getStats() {
  const res = await fetch(`${API_BASE}/stats`);
  return res.json();
}

// 매칭 참여
export async function joinMatch(data) {
  const res = await fetch(`${API_BASE}/match/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// 매칭 상태 확인
export async function getMatchStatus(matchRequestId) {
  const res = await fetch(`${API_BASE}/match/status?matchRequestId=${matchRequestId}`);
  return res.json();
}

// 매칭 취소
export async function cancelMatch(matchRequestId) {
  const res = await fetch(`${API_BASE}/match/cancel`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchRequestId }),
  });
  return res.json();
}

// 그룹 정보
export async function getGroup(groupId) {
  const res = await fetch(`${API_BASE}/groups/${groupId}`);
  return res.json();
}

// 모든 그룹
export async function getGroups() {
  const res = await fetch(`${API_BASE}/groups`);
  return res.json();
}

// 점심방 목록
export async function getRooms() {
  const res = await fetch(`${API_BASE}/rooms`);
  return res.json();
}

// 점심방 상세
export async function getRoom(roomId) {
  const res = await fetch(`${API_BASE}/rooms/${roomId}`);
  return res.json();
}

// 점심방 생성
export async function createRoom(data) {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// 점심방 참여
export async function joinRoom(roomId, userData) {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return res.json();
}

// 점심방 나가기
export async function leaveRoom(roomId, userId) {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

// 식당 목록
export async function getRestaurants(menu, priceRange) {
  let url = `${API_BASE}/restaurants`;
  const params = new URLSearchParams();
  if (menu) params.append('menu', menu);
  if (priceRange) params.append('priceRange', priceRange);
  if (params.toString()) url += `?${params.toString()}`;
  const res = await fetch(url);
  return res.json();
}

// 랜덤 식당 추천
export async function getRandomRestaurant(menu, priceRange) {
  let url = `${API_BASE}/restaurants/random`;
  const params = new URLSearchParams();
  if (menu) params.append('menu', menu);
  if (priceRange) params.append('priceRange', priceRange);
  if (params.toString()) url += `?${params.toString()}`;
  const res = await fetch(url);
  return res.json();
}

