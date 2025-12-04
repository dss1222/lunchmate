import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRoom, leaveRoom } from '../api'

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

export default function RoomDetail({ currentUser }) {
  const navigate = useNavigate()
  const { roomId } = useParams()

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchRoom()
    const interval = setInterval(fetchRoom, 3000)
    return () => clearInterval(interval)
  }, [roomId])

  async function fetchRoom() {
    try {
      const data = await getRoom(roomId)
      if (data.error) {
        navigate('/rooms')
        return
      }
      setRoom(data)
    } catch (err) {
      console.error('Room fetch error:', err)
      navigate('/rooms')
    } finally {
      setLoading(false)
    }
  }

  async function handleLeave() {
    if (!confirm('정말 방을 나가시겠어요?')) return

    setLeaving(true)
    try {
      await leaveRoom(roomId, currentUser.id)
      navigate('/rooms')
    } catch (err) {
      console.error('Leave error:', err)
      alert('방 나가기에 실패했습니다')
    } finally {
      setLeaving(false)
    }
  }

  const handleShare = async () => {
    const menuInfo = menuLabels[room.menu] || { name: room.menu, emoji: '🍽️' }
    const shareText = `🍱 점심방: ${room.title}\n\n⏰ ${room.timeSlot}\n${menuInfo.emoji} ${menuInfo.name}\n👥 ${room.members.length}/${room.maxCount}명\n\n함께 점심 먹어요!`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: room.title,
          text: shareText,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-4xl animate-spin-slow">🍱</div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">방을 찾을 수 없습니다</p>
        <button onClick={() => navigate('/rooms')} className="mt-4 text-primary-500">
          점심방 목록으로
        </button>
      </div>
    )
  }

  const menuInfo = menuLabels[room.menu] || { name: room.menu, emoji: '🍽️' }
  const isFull = room.members.length >= room.maxCount
  const isCreator = room.members.find(m => m.isCreator)?.id === currentUser.id
  const isJoined = room.members.some(m => m.id === currentUser.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/rooms')} className="text-2xl">←</button>
        <h1 className="text-xl font-bold flex-1 truncate">{room.title}</h1>
        {isCreator && (
          <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full">
            방장
          </span>
        )}
      </div>

      {/* Status Banner */}
      {isFull && (
        <div className="bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-2xl p-4 text-center">
          <div className="text-2xl mb-1">🎉</div>
          <div className="font-bold">인원이 모두 모였어요!</div>
          <div className="text-sm opacity-90">약속 시간에 만나요</div>
        </div>
      )}

      {/* Room Info Card */}
      <div className="bg-white/80 rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <span className="text-2xl">⏰</span>
            <div>
              <div className="text-xs text-gray-500">시간</div>
              <div className="font-medium text-gray-800">{room.timeSlot}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <span className="text-2xl">{menuInfo.emoji}</span>
            <div>
              <div className="text-xs text-gray-500">메뉴</div>
              <div className="font-medium text-gray-800">{menuInfo.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <span className="text-2xl">💰</span>
            <div>
              <div className="text-xs text-gray-500">가격대</div>
              <div className="font-medium text-gray-800">{priceLabels[room.priceRange]}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <span className="text-2xl">👥</span>
            <div>
              <div className="text-xs text-gray-500">인원</div>
              <div className="font-medium text-gray-800">{room.members.length}/{room.maxCount}명</div>
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white/80 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>👥</span> 참여자
        </h2>
        <div className="space-y-3">
          {room.members.map((member, idx) => (
            <div 
              key={member.id || idx}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                {member.name?.[0] || '?'}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800 flex items-center gap-2">
                  {member.name}
                  {member.isCreator && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">방장</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">{member.department}</div>
              </div>
              {member.id === currentUser.id && (
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full">나</span>
              )}
            </div>
          ))}

          {/* Empty Slots */}
          {Array.from({ length: room.maxCount - room.members.length }).map((_, idx) => (
            <div key={`empty-${idx}`} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                ?
              </div>
              <div className="text-gray-400">대기 중...</div>
            </div>
          ))}
        </div>
      </div>

      {/* Restaurant */}
      {room.restaurant && (
        <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-2xl p-5 border border-accent-100">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>🍽️</span> 식당
          </h2>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{room.restaurant.name}</h3>
                <p className="text-sm text-gray-500">
                  도보 {room.restaurant.distance}분 · {priceLabels[room.restaurant.price]}
                </p>
              </div>
              {room.restaurant.rating && (
                <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-lg">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-medium text-yellow-700">{room.restaurant.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Meeting Point */}
      <div className="bg-primary-50 rounded-2xl p-5 border border-primary-100">
        <h2 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
          <span>📍</span> 모임 장소
        </h2>
        <p className="text-gray-600">본관 1층 로비에서 {room.timeSlot} 5분 전에 만나요!</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleShare}
          className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 btn-press"
        >
          {copied ? '✅ 복사됨!' : '📤 공유하기'}
        </button>

        {isJoined && (
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors btn-press disabled:opacity-50"
          >
            {leaving ? '나가는 중...' : '방 나가기'}
          </button>
        )}
      </div>
    </div>
  )
}

