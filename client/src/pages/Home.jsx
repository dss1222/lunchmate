import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStats, getMyRooms } from '../api'

const menuLabels = {
  korean: { name: '한식', emoji: '🍚' },
  japanese: { name: '일식', emoji: '🍣' },
  chinese: { name: '중식', emoji: '🥟' },
  western: { name: '양식', emoji: '🍝' },
  salad: { name: '샐러드', emoji: '🥗' },
  snack: { name: '분식', emoji: '🍜' },
}

const menuCategories = [
  { id: 'korean', name: '한식', emoji: '🍚' },
  { id: 'japanese', name: '일식', emoji: '🍣' },
  { id: 'chinese', name: '중식', emoji: '🥟' },
  { id: 'western', name: '양식', emoji: '🍝' },
  { id: 'salad', name: '샐러드', emoji: '🥗' },
  { id: 'snack', name: '분식', emoji: '🍜' },
]

// 쩝쩝박사 레벨 정보
const getLevelInfo = (matchCount) => {
  if (matchCount >= 31) {
    return { level: 5, name: '쩝쩝박사 마스터', emoji: '👑', nextAt: null, color: 'level-5' }
  } else if (matchCount >= 16) {
    return { level: 4, name: '먹고수', emoji: '🏆', nextAt: 31, color: 'level-4' }
  } else if (matchCount >= 6) {
    return { level: 3, name: '미식가', emoji: '🍽️', nextAt: 16, color: 'level-3' }
  } else if (matchCount >= 2) {
    return { level: 2, name: '먹린이', emoji: '🍼', nextAt: 6, color: 'level-2' }
  } else {
    return { level: 1, name: '새싹', emoji: '🌱', nextAt: 2, color: 'level-1' }
  }
}

export default function Home({ currentUser, refreshUser }) {
  const [stats, setStats] = useState(null)
  const [myRooms, setMyRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchMyRooms()
    const interval = setInterval(() => {
      fetchStats()
      fetchMyRooms()
    }, 5000)
    return () => clearInterval(interval)
  }, [currentUser?.id])

  async function fetchStats() {
    try {
      const data = await getStats()
      setStats(data)
    } catch (err) {
      console.error('Stats fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMyRooms() {
    if (!currentUser?.id) return
    try {
      const data = await getMyRooms(currentUser.id)
      setMyRooms(data)
    } catch (err) {
      console.error('My rooms fetch error:', err)
    }
  }

  // 인기 메뉴 계산
  const popularMenus = stats?.menuStats 
    ? Object.entries(stats.menuStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => menuCategories.find(m => m.id === id))
        .filter(Boolean)
    : []

  // 현재 유저 레벨 정보
  const matchCount = currentUser?.matchCount || 0
  const levelInfo = getLevelInfo(matchCount)

  // 매칭 완료된 방이 있는지 확인
  const hasCompletedMatch = myRooms.some(room => 
    room.status === 'full' || room.members.length >= room.maxCount
  )

  return (
    <div className="space-y-6">
      {/* Hero Section with Level */}
      <div className="text-center py-6">
        <div className="text-6xl mb-4 animate-float">{levelInfo.emoji}</div>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3 ${levelInfo.color}`}>
          <span className="font-bold">Lv.{levelInfo.level}</span>
          <span>{levelInfo.name}</span>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          안녕하세요, <span className="text-blue-600">{currentUser.name}</span>님!
        </h1>
        <p className="text-gray-500 text-sm">
          총 {matchCount}회 매칭 완료
          {levelInfo.nextAt && (
            <span className="text-blue-500"> · 다음 레벨까지 {levelInfo.nextAt - matchCount}회 남음</span>
          )}
        </p>
      </div>

      {/* 오늘 내 점심방 */}
      {myRooms.length > 0 && (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 shadow-lg shadow-blue-200 text-white">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <span>🎉</span> 오늘 내 점심 매칭
          </h2>
          <div className="space-y-3">
            {myRooms.map(room => {
              const menuInfo = menuLabels[room.menu] || { name: room.menu, emoji: '🍽️' }
              const isFull = room.status === 'full' || room.members.length >= room.maxCount
              return (
                <Link
                  key={room.id}
                  to={`/rooms/${room.id}`}
                  className="block bg-white/20 hover:bg-white/30 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{room.title}</div>
                      <div className="text-sm text-blue-100 flex items-center gap-2 mt-1">
                        <span>{menuInfo.emoji} {menuInfo.name}</span>
                        <span>·</span>
                        <span>⏰ {room.timeSlot}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {isFull ? (
                        <span className="px-3 py-1 bg-green-400 text-green-900 rounded-full text-xs font-bold">
                          매칭 완료!
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                          {room.members.length}/{room.maxCount}명 대기중
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex -space-x-2">
                      {room.members.slice(0, 4).map((member, idx) => (
                        <div
                          key={member.id || idx}
                          className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold border-2 border-white/50"
                        >
                          {member.name?.[0] || '?'}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-blue-100">
                      {room.members.map(m => m.name).join(', ')}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA Button */}
      {hasCompletedMatch ? (
        <div className="block w-full bg-gray-300 text-gray-500 font-bold py-4 px-6 rounded-2xl text-center text-lg shadow-sm cursor-not-allowed">
          ✅ 오늘 점심 매칭 완료
        </div>
      ) : (
        <Link
          to="/join"
          className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-2xl text-center text-lg shadow-lg shadow-blue-200 transition-all btn-press card-hover"
        >
          🙋‍♂️ 오늘 점심 참여하기
        </Link>
      )}

      {/* Level Progress Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>🎖️</span> 나의 쩝쩝박사 레벨
        </h2>
        <div className="flex items-center gap-4">
          <div className={`text-4xl w-16 h-16 flex items-center justify-center rounded-2xl ${levelInfo.color}`}>
            {levelInfo.emoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg text-gray-800">Lv.{levelInfo.level} {levelInfo.name}</span>
            </div>
            {levelInfo.nextAt && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, (matchCount / levelInfo.nextAt) * 100)}%` 
                  }}
                />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {levelInfo.nextAt 
                ? `다음 레벨(${levelInfo.nextAt}회)까지 ${levelInfo.nextAt - matchCount}회 남았어요!`
                : '최고 레벨 달성! 🎉'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Popular Menus */}
      {popularMenus.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>🔥</span> 오늘 인기 메뉴
          </h2>
          <div className="flex gap-3">
            {popularMenus.map((menu, idx) => (
              <div 
                key={menu.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  idx === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <span>{menu.emoji}</span>
                <span className="font-medium">{menu.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <Link
          to="/rooms"
          className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100 card-hover"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏠</span>
            <div>
              <div className="font-semibold text-gray-800">점심방 둘러보기</div>
              <div className="text-sm text-gray-500">
                {stats?.totalRooms || 0}개의 방이 열려있어요
              </div>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>

        <Link
          to="/rooms/create"
          className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100 card-hover"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">➕</span>
            <div>
              <div className="font-semibold text-gray-800">내 점심방 만들기</div>
              <div className="text-sm text-gray-500">직접 방을 만들어 사람을 모아보세요</div>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
      </div>

      {/* 사내공지 Section */}
      <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-5 border border-blue-100">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>📢</span> 사내공지
        </h3>
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">공지</span>
              <span className="text-xs text-gray-400">2024.12.05</span>
            </div>
            <p className="text-sm text-gray-700 font-medium">🎄 12월 송년회 점심 매칭 이벤트!</p>
            <p className="text-xs text-gray-500 mt-1">이번 달 매칭 5회 달성 시 스타벅스 기프티콘 증정</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">안내</span>
              <span className="text-xs text-gray-400">2024.12.01</span>
            </div>
            <p className="text-sm text-gray-700 font-medium">LunchMate 서비스 오픈 안내</p>
            <p className="text-xs text-gray-500 mt-1">혼밥 탈출! 같이 점심 먹을 동료를 찾아보세요</p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>💡</span> 이용 방법
        </h3>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2">
            <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <span>원하는 시간, 가격대, 메뉴를 선택하세요</span>
          </li>
          <li className="flex gap-2">
            <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <span>비슷한 조건의 동료와 자동으로 매칭돼요</span>
          </li>
          <li className="flex gap-2">
            <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <span>함께 점심을 즐기고 새로운 인연을 만들어보세요!</span>
          </li>
        </ol>
      </div>

      {/* 쩝쩝박사 레벨 안내 */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>📊</span> 쩝쩝박사 레벨 기준
        </h3>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className={`flex items-center justify-between p-2 rounded-lg ${
            levelInfo.level === 1 
              ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200' 
              : 'bg-white'
          }`}>
            <span className="flex items-center gap-2"><span>🌱</span> Lv.1 새싹</span>
            <span className={levelInfo.level === 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>매칭 1회</span>
          </div>
          <div className={`flex items-center justify-between p-2 rounded-lg ${
            levelInfo.level === 2 
              ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200' 
              : 'bg-white'
          }`}>
            <span className="flex items-center gap-2"><span>🍼</span> Lv.2 먹린이</span>
            <span className={levelInfo.level === 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>매칭 2~5회</span>
          </div>
          <div className={`flex items-center justify-between p-2 rounded-lg ${
            levelInfo.level === 3 
              ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200' 
              : 'bg-white'
          }`}>
            <span className="flex items-center gap-2"><span>🍽️</span> Lv.3 미식가</span>
            <span className={levelInfo.level === 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}>매칭 6~15회</span>
          </div>
          <div className={`flex items-center justify-between p-2 rounded-lg ${
            levelInfo.level === 4 
              ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200' 
              : 'bg-white'
          }`}>
            <span className="flex items-center gap-2"><span>🏆</span> Lv.4 먹고수</span>
            <span className={levelInfo.level === 4 ? 'text-blue-600 font-medium' : 'text-gray-500'}>매칭 16~30회</span>
          </div>
          <div className={`flex items-center justify-between p-2 rounded-lg ${
            levelInfo.level === 5 
              ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200' 
              : 'bg-white'
          }`}>
            <span className="flex items-center gap-2"><span>👑</span> Lv.5 쩝쩝박사 마스터</span>
            <span className={levelInfo.level === 5 ? 'text-blue-600 font-medium' : 'text-gray-500'}>매칭 31회+</span>
          </div>
        </div>
      </div>
    </div>
  )
}
