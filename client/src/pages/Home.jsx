import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStats } from '../api'

const menuCategories = [
  { id: 'korean', name: '한식', emoji: '🍚' },
  { id: 'japanese', name: '일식', emoji: '🍣' },
  { id: 'chinese', name: '중식', emoji: '🥟' },
  { id: 'western', name: '양식', emoji: '🍝' },
  { id: 'salad', name: '샐러드', emoji: '🥗' },
  { id: 'snack', name: '분식', emoji: '🍜' },
]

export default function Home({ currentUser }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000) // 5초마다 갱신
    return () => clearInterval(interval)
  }, [])

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

  // 인기 메뉴 계산
  const popularMenus = stats?.menuStats 
    ? Object.entries(stats.menuStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => menuCategories.find(m => m.id === id))
        .filter(Boolean)
    : []

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <div className="text-6xl mb-4 animate-float">🍱</div>
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">혼밥 탈출!</span>
        </h1>
        <p className="text-gray-600 mb-2">같이 점심 먹을 사람을 찾아보세요</p>
        <p className="text-sm text-gray-500">
          👋 안녕하세요, <span className="font-semibold text-primary-600">{currentUser.name}</span>님!
        </p>
      </div>

      {/* CTA Button */}
      <Link
        to="/join"
        className="block w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-4 px-6 rounded-2xl text-center text-lg shadow-lg shadow-primary-200 transition-all btn-press card-hover"
      >
        🙋‍♂️ 오늘 점심 참여하기
      </Link>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/80 rounded-2xl p-4 shadow-sm card-hover">
          <div className="text-3xl mb-1">👥</div>
          <div className="text-2xl font-bold text-primary-600">
            {loading ? (
              <div className="h-8 w-16 shimmer rounded"></div>
            ) : (
              stats?.totalParticipants || 0
            )}
          </div>
          <div className="text-sm text-gray-500">오늘 참여자</div>
        </div>
        <div className="bg-white/80 rounded-2xl p-4 shadow-sm card-hover">
          <div className="text-3xl mb-1">🎉</div>
          <div className="text-2xl font-bold text-accent-600">
            {loading ? (
              <div className="h-8 w-16 shimmer rounded"></div>
            ) : (
              stats?.totalGroups || 0
            )}
          </div>
          <div className="text-sm text-gray-500">완료된 매칭</div>
        </div>
      </div>

      {/* Popular Menus */}
      {popularMenus.length > 0 && (
        <div className="bg-white/80 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>🔥</span> 인기 메뉴
          </h2>
          <div className="flex gap-3">
            {popularMenus.map((menu, idx) => (
              <div 
                key={menu.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  idx === 0 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
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
          className="flex items-center justify-between bg-white/80 rounded-2xl p-4 shadow-sm card-hover"
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
          className="flex items-center justify-between bg-white/80 rounded-2xl p-4 shadow-sm card-hover"
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

      {/* Info Section */}
      <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-5 border border-primary-100">
        <h3 className="font-bold text-gray-800 mb-3">💡 이용 방법</h3>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2">
            <span className="bg-primary-200 text-primary-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <span>원하는 시간, 가격대, 메뉴를 선택하세요</span>
          </li>
          <li className="flex gap-2">
            <span className="bg-primary-200 text-primary-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <span>비슷한 조건의 동료와 자동으로 매칭돼요</span>
          </li>
          <li className="flex gap-2">
            <span className="bg-primary-200 text-primary-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <span>함께 점심을 즐기고 새로운 인연을 만들어보세요!</span>
          </li>
        </ol>
      </div>
    </div>
  )
}

