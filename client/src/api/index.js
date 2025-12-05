// 개발: vite proxy 사용 (/api -> localhost:3001)
// 배포: vercel rewrites 사용 (/api -> render backend)
// VITE_API_URL이 설정되어 있으면 직접 호출
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ============ 인증 헬퍼 ============
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ============ 인증 API ============

// 회원가입
export async function register(data) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.detail || '회원가입에 실패했습니다');
  }
  return result;
}

// 로그인
export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.detail || '로그인에 실패했습니다');
  }
  // 토큰 저장
  localStorage.setItem('token', result.token);
  localStorage.setItem('user', JSON.stringify(result.user));
  return result;
}

// 로그아웃
export async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
    });
  } catch (err) {
    console.error('Logout error:', err);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// 현재 사용자 정보
export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    throw new Error('인증이 필요합니다');
  }
  return res.json();
}

// 저장된 사용자 정보 가져오기
export function getStoredUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// 로그인 상태 확인
export function isLoggedIn() {
  return !!localStorage.getItem('token');
}

// ============ 통계 API ============

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
export async function getMatchStatus(matchRequestId, elapsedSeconds = 0) {
  const res = await fetch(`${API_BASE}/match/status?matchRequestId=${matchRequestId}&elapsedSeconds=${elapsedSeconds}`);
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

