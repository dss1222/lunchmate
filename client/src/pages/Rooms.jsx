import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getRooms, joinRoom } from '../api'

const menuLabels = {
  korean: { name: '한식', emoji: '🍚' },
  japanese: { name: '일식', emoji: '🍣' },
  chinese: { name: '중식', emoji: '🥟' },
  western: { name: '양식', emoji: '🍝' },
  salad: { name: '샐러드', emoji: '🥗' },
  snack: { name: '분식', emoji: '🍜' },
}

const priceLabels = {
  low: '7천원 이하',
  mid: '7천 ~ 1.2만',
  high: '1.2만 이상',
}

export default function Rooms({ currentUser }) {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(null)

  useEffect(() => {
    fetchRooms()
    const interval = setInterval(fetchRooms, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchRooms() {
    try {
      const data = await getRooms()
      setRooms(data)
    } catch (err) {
      console.error('Rooms fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(roomId) {
    setJoining(roomId)
    try {
      const result = await joinRoom(roomId, {
        userId: currentUser.id,
        name: currentUser.name,
        department: currentUser.department,
      })

      if (result.error) {
        alert(result.error)
      } else {
        navigate(`/rooms/${roomId}`)
      }
    } catch (err) {
      console.error('Join error:', err)
      alert('참여에 실패했습니다')
    } finally {
      setJoining(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-4xl animate-spin-slow">🍱</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>🏠</span> 열려있는 점심방
        </h1>
        <Link
          to="/rooms/create"
          className="flex items-center gap-1 px-4 py-2 bg-primary-500 text-white rounded-xl font-medium text-sm btn-press"
        >
          <span>+</span> 방 만들기
        </Link>
      </div>

      {/* Rooms List */}
      {rooms.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <div className="text-5xl">🏠</div>
          <div className="text-gray-500">아직 열려있는 방이 없어요</div>
          <Link
            to="/rooms/create"
            className="inline-block px-6 py-3 bg-primary-500 text-white rounded-xl font-medium btn-press"
          >
            첫 번째 방 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rooms.map(room => {
            const menuInfo = menuLabels[room.menu] || { name: room.menu, emoji: '🍽️' }
            const isFull = room.members.length >= room.maxCount
            const isJoined = room.members.some(m => m.id === currentUser.id)

            return (
              <div
                key={room.id}
                className="bg-white/80 rounded-2xl p-5 shadow-sm card-hover"
              >
                {/* Room Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{room.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">
                        {menuInfo.emoji} {menuInfo.name}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-500">{priceLabels[room.priceRange]}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isFull 
                      ? 'bg-gray-100 text-gray-500' 
                      : 'bg-primary-100 text-primary-600'
                  }`}>
                    {room.members.length}/{room.maxCount}명
                  </div>
                </div>

                {/* Room Info */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    ⏰ {room.timeSlot}
                  </span>
                  {room.restaurant && (
                    <span className="flex items-center gap-1">
                      📍 {room.restaurant.name}
                    </span>
                  )}
                </div>

                {/* Members Preview */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-2">
                    {room.members.slice(0, 4).map((member, idx) => (
                      <div
                        key={member.id || idx}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                        title={`${member.name} / ${member.department}`}
                      >
                        {member.name?.[0] || '?'}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {room.members.map(m => m.name).join(', ')}
                  </span>
                </div>

                {/* Action Button */}
                {isJoined ? (
                  <Link
                    to={`/rooms/${room.id}`}
                    className="block w-full py-3 bg-accent-500 text-white text-center rounded-xl font-medium btn-press"
                  >
                    내 방 보기 →
                  </Link>
                ) : isFull ? (
                  <button
                    disabled
                    className="w-full py-3 bg-gray-200 text-gray-500 rounded-xl font-medium cursor-not-allowed"
                  >
                    인원이 꽉 찼어요
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoin(room.id)}
                    disabled={joining === room.id}
                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium btn-press disabled:opacity-50"
                  >
                    {joining === room.id ? '참여 중...' : '참여하기'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Refresh Hint */}
      <p className="text-center text-xs text-gray-400">
        5초마다 자동으로 새로고침됩니다
      </p>
    </div>
  )
}

