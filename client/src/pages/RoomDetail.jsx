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

// 쩝쩝박사 레벨 정보
const getLevelInfo = (matchCount) => {
  if (matchCount >= 31) {
    return { level: 5, name: '쩝쩝박사 마스터', emoji: '👑', color: 'level-5' }
  } else if (matchCount >= 16) {
    return { level: 4, name: '먹고수', emoji: '🏆', color: 'level-4' }
  } else if (matchCount >= 6) {
    return { level: 3, name: '미식가', emoji: '🍽️', color: 'level-3' }
  } else if (matchCount >= 2) {
    return { level: 2, name: '먹린이', emoji: '🍼', color: 'level-2' }
  } else {
    return { level: 1, name: '새싹', emoji: '🌱', color: 'level-1' }
  }
}

export default function RoomDetail({ currentUser, refreshUser }) {
  const navigate = useNavigate()
  const { roomId } = useParams()

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [wasFullBefore, setWasFullBefore] = useState(false)

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
      
      // 방이 가득 찼을 때 사용자 정보 새로고침 (매칭 횟수 반영)
      const isFull = data.members?.length >= data.maxCount
      if (isFull && !wasFullBefore && refreshUser) {
        refreshUser()
        setWasFullBefore(true)
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
        <button onClick={() => navigate('/rooms')} className="mt-4 text-blue-500">
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
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
            방장
          </span>
        )}
      </div>

      {/* Status Banner */}
      {isFull && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-4 text-center">
          <div className="text-2xl mb-1">🎉</div>
          <div className="font-bold">인원이 모두 모였어요!</div>
          <div className="text-sm opacity-90">약속 시간에 만나요</div>
        </div>
      )}

      {/* Room Info Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <span className="text-2xl">⏰</span>
            <div>
              <div className="text-xs text-gray-500">시간</div>
              <div className="font-medium text-gray-800">{room.timeSlot}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <span className="text-2xl">{menuInfo.emoji}</span>
            <div>
              <div className="text-xs text-gray-500">메뉴</div>
              <div className="font-medium text-gray-800">{menuInfo.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <span className="text-2xl">💰</span>
            <div>
              <div className="text-xs text-gray-500">가격대</div>
              <div className="font-medium text-gray-800">{priceLabels[room.priceRange]}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <span className="text-2xl">👥</span>
            <div>
              <div className="text-xs text-gray-500">인원</div>
              <div className="font-medium text-gray-800">{room.members.length}/{room.maxCount}명</div>
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>👥</span> 참여자
        </h2>
        <div className="space-y-3">
          {room.members.map((member, idx) => {
            const memberLevel = getLevelInfo(member.matchCount || 0)
            return (
              <div 
                key={member.id || idx}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {member.name?.[0] || '?'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 flex items-center gap-2">
                    {member.name}
                    {member.isCreator && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">방장</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-gray-500">{member.department}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${memberLevel.color}`}>
                      {memberLevel.emoji} Lv.{memberLevel.level}
                    </span>
                  </div>
                </div>
                {member.id === currentUser.id && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">나</span>
                )}
              </div>
            )
          })}

          {/* Empty Slots */}
          {Array.from({ length: room.maxCount - room.members.length }).map((_, idx) => (
            <div key={`empty-${idx}`} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                ?
              </div>
              <div className="text-gray-400">대기 중...</div>
            </div>
          ))}
        </div>
      </div>

      {/* Restaurant */}
      <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-5 border border-blue-100">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>🍽️</span> 식당
        </h2>
        {room.restaurant ? (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{room.restaurant.name}</h3>
                {room.restaurant.category && (
                  <p className="text-sm text-gray-500 mt-1">{room.restaurant.category}</p>
                )}
                {room.restaurant.address && (
                  <p className="text-xs text-gray-400 mt-1">{room.restaurant.address}</p>
                )}
              </div>
              {room.restaurant.distance && (
                <div className="text-sm font-medium text-blue-600">
                  {room.restaurant.distance}m
                </div>
              )}
            </div>
            {room.restaurant.placeUrl && (
              <a
                href={room.restaurant.placeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-medium text-center rounded-lg text-sm transition-all"
              >
                🗺️ 카카오맵에서 보기
              </a>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-3xl mb-2">{menuInfo.emoji}</div>
            <p className="font-medium text-gray-700">{menuInfo.name} 맛집</p>
            <p className="text-sm text-gray-500 mt-1">만나서 정해요!</p>
          </div>
        )}
      </div>

      {/* Meeting Point */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
        <h2 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
          <span>📍</span> 모임 장소
        </h2>
        <p className="text-gray-600">본관 1층 로비에서 {room.timeSlot} 5분 전에 만나요!</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleShare}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 btn-press"
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
