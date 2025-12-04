import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ============ In-Memory 데이터 저장소 ============
let users = []; // 등록된 모든 유저
let waitingUsers = []; // 매칭 대기중인 유저
let groups = []; // 완성된 매칭 그룹
let rooms = []; // 점심방



// 샘플 식당 데이터
const restaurants = [
  { id: 'r1', name: '김밥천국', type: 'korean', price: 'low', distance: 3, rating: 4.2 },
  { id: 'r2', name: '한솥도시락', type: 'korean', price: 'low', distance: 4, rating: 4.0 },
  { id: 'r3', name: '백반의민족', type: 'korean', price: 'mid', distance: 5, rating: 4.5 },
  { id: 'r4', name: '스시로', type: 'japanese', price: 'mid', distance: 6, rating: 4.3 },
  { id: 'r5', name: '이자카야 하나', type: 'japanese', price: 'high', distance: 8, rating: 4.6 },
  { id: 'r6', name: '짬뽕지존', type: 'chinese', price: 'mid', distance: 4, rating: 4.1 },
  { id: 'r7', name: '딤섬하우스', type: 'chinese', price: 'high', distance: 10, rating: 4.7 },
  { id: 'r8', name: '샐러디', type: 'salad', price: 'mid', distance: 3, rating: 4.4 },
  { id: 'r9', name: '써브웨이', type: 'salad', price: 'low', distance: 2, rating: 4.0 },
  { id: 'r10', name: '떡볶이천국', type: 'snack', price: 'low', distance: 3, rating: 4.2 },
  { id: 'r11', name: '피자헛', type: 'western', price: 'mid', distance: 7, rating: 4.0 },
  { id: 'r12', name: '파스타앤코', type: 'western', price: 'high', distance: 9, rating: 4.5 },
];

// 샘플 유저 데이터 (데모용)
const sampleUsers = [
  { id: 'demo1', name: '김철수', department: 'AI팀', gender: 'male', age: 28, level: 'junior' },
  { id: 'demo2', name: '이영희', department: '개발팀', gender: 'female', age: 32, level: 'senior' },
  { id: 'demo3', name: '박지민', department: '디자인팀', gender: 'female', age: 26, level: 'junior' },
  { id: 'demo4', name: '최동욱', department: '마케팅팀', gender: 'male', age: 35, level: 'manager' },
  { id: 'demo5', name: '정수현', department: '컨설팅팀', gender: 'female', age: 29, level: 'senior' },
];

users = [...sampleUsers];

// ============ 헬스체크 ============
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ 통계 API ============
app.get('/stats', (req, res) => {
  const menuStats = {};
  const timeStats = {};

  [...waitingUsers, ...groups.flatMap(g => g.members)].forEach(u => {
    if (u.menu) {
      menuStats[u.menu] = (menuStats[u.menu] || 0) + 1;
    }
    if (u.timeSlot) {
      timeStats[u.timeSlot] = (timeStats[u.timeSlot] || 0) + 1;
    }
  });

  res.json({
    totalParticipants: waitingUsers.length + groups.flatMap(g => g.members).length,
    waitingUsers: waitingUsers.length,
    totalGroups: groups.length,
    totalRooms: rooms.length,
    menuStats,
    timeStats,
  });
});

// ============ 유저 API ============
app.get('/users', (req, res) => {
  res.json(users);
});

app.get('/users/:userId', (req, res) => {
  const user = users.find(u => u.id === req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// ============ 매칭 API ============
app.post('/match/join', (req, res) => {
  const { userId, name, department, timeSlot, priceRange, menu, preferences } = req.body;

  if (!timeSlot || !priceRange || !menu) {
    return res.status(400).json({ error: 'timeSlot, priceRange, menu are required' });
  }

  const matchRequest = {
    id: uuidv4(),
    oduserId: userId || uuidv4(),
    name: name || '익명',
    department: department || '미지정',
    timeSlot,
    priceRange,
    menu,
    preferences: preferences || {},
    joinedAt: new Date().toISOString(),
  };

  // 같은 조건의 대기자 찾기
  const matchingUsers = waitingUsers.filter(u => 
    u.timeSlot === timeSlot &&
    u.priceRange === priceRange &&
    u.menu === menu
  );

  // 선호도 기반 필터링 (soft filter - 가능하면 적용)
  let filteredUsers = matchingUsers;
  if (preferences?.similarAge || preferences?.sameGender || preferences?.sameLevel) {
    const user = users.find(u => u.id === userId);
    if (user) {
      filteredUsers = matchingUsers.filter(mu => {
        const matchedUser = users.find(u => u.id === mu.userId);
        if (!matchedUser) return true;
        
        let score = 0;
        if (preferences.similarAge && Math.abs((matchedUser.age || 30) - (user.age || 30)) <= 5) score++;
        if (preferences.sameGender && matchedUser.gender === user.gender) score++;
        if (preferences.sameLevel && matchedUser.level === user.level) score++;
        
        return score > 0 || !preferences.similarAge && !preferences.sameGender && !preferences.sameLevel;
      });
    }
    if (filteredUsers.length === 0) filteredUsers = matchingUsers;
  }

  // 2명 이상이면 매칭 성공
  if (filteredUsers.length >= 1) {
    const groupMembers = [matchRequest, ...filteredUsers.slice(0, 3)]; // 최대 4명
    
    // 매칭된 유저들을 대기열에서 제거
    groupMembers.forEach(m => {
      waitingUsers = waitingUsers.filter(u => u.id !== m.id);
    });

    // 그룹 생성
    const group = {
      id: uuidv4(),
      members: groupMembers,
      timeSlot,
      priceRange,
      menu,
      createdAt: new Date().toISOString(),
      restaurant: getRecommendedRestaurant(menu, priceRange),
    };
    groups.push(group);

    return res.json({
      status: 'matched',
      groupId: group.id,
      matchRequest,
    });
  }

  // 매칭 실패 - 대기열에 추가
  waitingUsers.push(matchRequest);

  res.json({
    status: 'waiting',
    matchRequestId: matchRequest.id,
    userId: matchRequest.userId,
    waitingCount: waitingUsers.filter(u => 
      u.timeSlot === timeSlot && u.priceRange === priceRange && u.menu === menu
    ).length,
  });
});

app.get('/match/status', (req, res) => {
  const { matchRequestId } = req.query;

  if (!matchRequestId) {
    return res.status(400).json({ error: 'matchRequestId is required' });
  }

  // 대기열에 있는지 확인
  const inWaiting = waitingUsers.find(u => u.id === matchRequestId);
  if (inWaiting) {
    return res.json({
      status: 'waiting',
      waitingCount: waitingUsers.filter(u => 
        u.timeSlot === inWaiting.timeSlot && 
        u.priceRange === inWaiting.priceRange && 
        u.menu === inWaiting.menu
      ).length,
    });
  }

  // 그룹에 있는지 확인
  const group = groups.find(g => g.members.some(m => m.id === matchRequestId));
  if (group) {
    return res.json({
      status: 'matched',
      groupId: group.id,
    });
  }

  res.json({ status: 'not_found' });
});

app.delete('/match/cancel', (req, res) => {
  const { matchRequestId } = req.body;
  waitingUsers = waitingUsers.filter(u => u.id !== matchRequestId);
  res.json({ success: true });
});

// ============ 그룹 API ============
app.get('/groups', (req, res) => {
  res.json(groups);
});

app.get('/groups/:groupId', (req, res) => {
  const group = groups.find(g => g.id === req.params.groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }
  
  // 추천 식당 목록 추가
  const recommendedRestaurants = getRecommendedRestaurants(group.menu, group.priceRange, 3);
  
  res.json({
    ...group,
    recommendedRestaurants,
  });
});

// ============ 점심방 API ============
app.get('/rooms', (req, res) => {
  const activeRooms = rooms.filter(r => r.members.length < r.maxCount && r.status === 'open');
  res.json(activeRooms);
});

app.get('/rooms/:roomId', (req, res) => {
  const room = rooms.find(r => r.id === req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room);
});

app.post('/rooms', (req, res) => {
  const { title, timeSlot, menu, priceRange, maxCount, creatorId, creatorName, creatorDepartment, restaurant } = req.body;

  if (!title || !timeSlot || !menu || !maxCount) {
    return res.status(400).json({ error: 'title, timeSlot, menu, maxCount are required' });
  }

  const room = {
    id: uuidv4(),
    title,
    timeSlot,
    menu,
    priceRange: priceRange || 'mid',
    maxCount: Math.min(Math.max(maxCount, 2), 6),
    members: [{
      id: creatorId || uuidv4(),
      name: creatorName || '방장',
      department: creatorDepartment || '미지정',
      isCreator: true,
    }],
    restaurant: restaurant || getRecommendedRestaurant(menu, priceRange),
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  rooms.push(room);
  res.json(room);
});

app.post('/rooms/:roomId/join', (req, res) => {
  const { userId, name, department } = req.body;
  const room = rooms.find(r => r.id === req.params.roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.members.length >= room.maxCount) {
    return res.status(400).json({ error: 'Room is full', status: 'full' });
  }

  if (room.members.some(m => m.id === userId)) {
    return res.status(400).json({ error: 'Already joined' });
  }

  room.members.push({
    id: userId || uuidv4(),
    name: name || '참여자',
    department: department || '미지정',
    joinedAt: new Date().toISOString(),
  });

  // 인원이 다 차면 상태 변경
  if (room.members.length >= room.maxCount) {
    room.status = 'full';
  }

  res.json(room);
});

app.post('/rooms/:roomId/leave', (req, res) => {
  const { userId } = req.body;
  const room = rooms.find(r => r.id === req.params.roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  room.members = room.members.filter(m => m.id !== userId);
  
  if (room.members.length === 0) {
    rooms = rooms.filter(r => r.id !== room.id);
    return res.json({ deleted: true });
  }

  room.status = 'open';
  res.json(room);
});

// ============ 식당 API ============
app.get('/restaurants', (req, res) => {
  const { menu, priceRange } = req.query;
  let filtered = [...restaurants];

  if (menu) {
    filtered = filtered.filter(r => r.type === menu);
  }
  if (priceRange) {
    filtered = filtered.filter(r => r.price === priceRange);
  }

  res.json(filtered);
});

app.get('/restaurants/random', (req, res) => {
  const { menu, priceRange } = req.query;
  let filtered = [...restaurants];

  if (menu) {
    filtered = filtered.filter(r => r.type === menu);
  }
  if (priceRange) {
    filtered = filtered.filter(r => r.price === priceRange);
  }

  if (filtered.length === 0) {
    return res.json(restaurants[Math.floor(Math.random() * restaurants.length)]);
  }

  res.json(filtered[Math.floor(Math.random() * filtered.length)]);
});

// ============ 헬퍼 함수 ============
function getRecommendedRestaurant(menu, priceRange) {
  const menuTypeMap = {
    korean: 'korean',
    japanese: 'japanese',
    chinese: 'chinese',
    western: 'western',
    salad: 'salad',
    snack: 'snack',
  };

  let filtered = restaurants.filter(r => r.type === menuTypeMap[menu]);
  if (priceRange) {
    const priceFiltered = filtered.filter(r => r.price === priceRange);
    if (priceFiltered.length > 0) filtered = priceFiltered;
  }

  if (filtered.length === 0) filtered = restaurants;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function getRecommendedRestaurants(menu, priceRange, count = 3) {
  const menuTypeMap = {
    korean: 'korean',
    japanese: 'japanese',
    chinese: 'chinese',
    western: 'western',
    salad: 'salad',
    snack: 'snack',
  };

  let filtered = restaurants.filter(r => r.type === menuTypeMap[menu]);
  if (priceRange) {
    const priceFiltered = filtered.filter(r => r.price === priceRange);
    if (priceFiltered.length > 0) filtered = priceFiltered;
  }

  if (filtered.length === 0) filtered = restaurants;
  
  // 셔플하고 count개 반환
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ============ 서버 시작 ============
app.listen(PORT, () => {
  console.log(`🍱 LunchMate Server running on http://localhost:${PORT}`);
});

