import { useState, useEffect } from 'react'
import { getStats, getGroups, getRooms } from '../api'

const menuLabels = {
  korean: { name: '한식', emoji: '🍚', color: 'bg-orange-100 text-orange-700' },
  japanese: { name: '일식', emoji: '🍣', color: 'bg-red-100 text-red-700' },
  chinese: { name: '중식', emoji: '🥟', color: 'bg-yellow-100 text-yellow-700' },
  western: { name: '양식', emoji: '🍝', color: 'bg-blue-100 text-blue-700' },
  salad: { name: '샐러드', emoji: '🥗', color: 'bg-green-100 text-green-700' },
  snack: { name: '분식', emoji: '🍜', color: 'bg-purple-100 text-purple-700' },
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [groups, setGroups] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      const [statsData, groupsData, roomsData] = await Promise.all([
        getStats(),
        getGroups(),
        getRooms(),
      ])
      setStats(statsData)
      setGroups(groupsData)
      setRooms(roomsData)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-4xl animate-spin-slow">📊</div>
      </div>
    )
  }

  // 메뉴별 통계 정렬
  const sortedMenuStats = stats?.menuStats 
    ? Object.entries(stats.menuStats).sort((a, b) => b[1] - a[1])
    : []

  // 시간대별 통계 정렬
  const sortedTimeStats = stats?.timeStats
    ? Object.entries(stats.timeStats).sort((a, b) => a[0].localeCompare(b[0]))
    : []

  const maxMenuCount = sortedMenuStats.length > 0 ? sortedMenuStats[0][1] : 1
  const maxTimeCount = sortedTimeStats.length > 0 ? Math.max(...sortedTimeStats.map(t => t[1])) : 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>📊</span> 오늘의 매칭 현황
        </h1>
        <span className="text-xs text-gray-400">5초마다 갱신</span>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-3xl font-bold">{stats?.totalParticipants || 0}</div>
          <div className="text-sm opacity-80">전체 참여자</div>
        </div>
        <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-5 text-white">
          <div className="text-4xl mb-2">🎉</div>
          <div className="text-3xl font-bold">{stats?.totalGroups || 0}</div>
          <div className="text-sm opacity-80">완료된 매칭</div>
        </div>
        <div className="bg-white/80 rounded-2xl p-5 shadow-sm">
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-2xl font-bold text-gray-800">{stats?.waitingUsers || 0}</div>
          <div className="text-sm text-gray-500">대기 중</div>
        </div>
        <div className="bg-white/80 rounded-2xl p-5 shadow-sm">
          <div className="text-3xl mb-2">🏠</div>
          <div className="text-2xl font-bold text-gray-800">{stats?.totalRooms || 0}</div>
          <div className="text-sm text-gray-500">열린 방</div>
        </div>
      </div>

      {/* Menu Stats */}
      <div className="bg-white/80 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔥</span> 인기 메뉴 TOP
        </h2>
        {sortedMenuStats.length === 0 ? (
          <p className="text-center text-gray-400 py-4">아직 데이터가 없어요</p>
        ) : (
          <div className="space-y-3">
            {sortedMenuStats.slice(0, 5).map(([menuId, count], idx) => {
              const menu = menuLabels[menuId] || { name: menuId, emoji: '🍽️', color: 'bg-gray-100 text-gray-700' }
              const percentage = (count / maxMenuCount) * 100

              return (
                <div key={menuId} className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold text-gray-400">
                    {idx + 1}
                  </span>
                  <span className="text-xl">{menu.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-700">{menu.name}</span>
                      <span className={`text-sm px-2 py-0.5 rounded-full ${menu.color}`}>
                        {count}명
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Time Stats */}
      <div className="bg-white/80 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>⏰</span> 시간대별 현황
        </h2>
        {sortedTimeStats.length === 0 ? (
          <p className="text-center text-gray-400 py-4">아직 데이터가 없어요</p>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {['11:30', '12:00', '12:30', '13:00'].map(time => {
              const count = stats?.timeStats?.[time] || 0
              const percentage = maxTimeCount > 0 ? (count / maxTimeCount) * 100 : 0

              return (
                <div key={time} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '80px' }}>
                    <div 
                      className="absolute bottom-0 w-full bg-gradient-to-t from-accent-500 to-accent-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${Math.max(percentage, 5)}%` }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-gray-700">
                      {count}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{time}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Groups */}
      <div className="bg-white/80 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>✅</span> 최근 완료된 매칭
        </h2>
        {groups.length === 0 ? (
          <p className="text-center text-gray-400 py-4">아직 완료된 매칭이 없어요</p>
        ) : (
          <div className="space-y-3">
            {groups.slice(-5).reverse().map(group => {
              const menu = menuLabels[group.menu] || { name: group.menu, emoji: '🍽️' }
              return (
                <div key={group.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl">{menu.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-700">
                      {group.members.map(m => m.name).join(', ')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {group.timeSlot} · {menu.name} · {group.members.length}명
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Active Rooms */}
      <div className="bg-white/80 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🏠</span> 활성 점심방
        </h2>
        {rooms.length === 0 ? (
          <p className="text-center text-gray-400 py-4">열려있는 방이 없어요</p>
        ) : (
          <div className="space-y-3">
            {rooms.slice(0, 5).map(room => {
              const menu = menuLabels[room.menu] || { name: room.menu, emoji: '🍽️' }
              return (
                <div key={room.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl">{menu.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-700">{room.title}</div>
                    <div className="text-xs text-gray-500">
                      {room.timeSlot} · {room.members.length}/{room.maxCount}명
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    room.members.length < room.maxCount 
                      ? 'bg-accent-100 text-accent-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {room.members.length < room.maxCount ? '모집중' : '완료'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

