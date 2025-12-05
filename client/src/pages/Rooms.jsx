import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getRooms, joinRoom, getActiveStatus } from '../api'

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

// 방 카드 컴포넌트
function RoomCard({ room, currentUser, joining, onJoin, getLevelInfo, menuLabels, priceLabels, activeStatus }) {
  const menuInfo = menuLabels[room.menu] || { name: room.menu, emoji: '🍽️' }
  const isFull = room.status === 'full' || room.members.length >= room.maxCount
  const isJoined = room.members.some(m => m.id === currentUser.id)
  const creator = room.members.find(m => m.isCreator)
  const creatorLevel = getLevelInfo(creator?.matchCount || 0)
  
  // 이미 다른 점심 활동에 참여 중이고, 이 방에 참여하지 않은 경우 참여 불가
  const isBlocked = activeStatus?.active && !isJoined
  const blockReason = activeStatus?.type

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border card-hover ${
      isFull ? 'border-green-200' : 'border-gray-100'
    }`}>
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
            ? 'bg-green-100 text-green-700' 
            : 'bg-blue-100 text-blue-600'
        }`}>
          {isFull ? '✓ 매칭완료' : `${room.members.length}/${room.maxCount}명`}
        </div>
      </div>

      {/* 방장 레벨 표시 */}
      {creator && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-slate-50 rounded-lg">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {creator.name?.[0] || '?'}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-1">
              {creator.name}
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">방장</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${creatorLevel.color}`}>
                {creatorLevel.emoji} Lv.{creatorLevel.level} {creatorLevel.name}
              </span>
            </div>
          </div>
        </div>
      )}

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
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white ${
                isFull ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'
              }`}
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
          className={`block w-full py-3 text-white text-center rounded-xl font-medium btn-press ${
            isFull ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isFull ? '🎉 매칭된 방 보기' : '내 방 보기 →'}
        </Link>
      ) : isFull ? (
        <div className="w-full py-3 bg-green-50 text-green-700 rounded-xl font-medium text-center border border-green-200">
          ✓ 매칭 완료된 방입니다
        </div>
      ) : isBlocked ? (
        <button
          disabled
          className="w-full py-3 bg-gray-200 text-gray-500 rounded-xl font-medium cursor-not-allowed"
        >
          {blockReason === 'waiting' && '⏳ 매칭 진행 중입니다'}
          {blockReason === 'room' && '🏠 이미 참여 중인 방이 있어요'}
          {blockReason === 'group' && '🔒 오늘 매칭이 완료되었어요'}
        </button>
      ) : (
        <button
          onClick={() => onJoin(room.id)}
          disabled={joining === room.id}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium btn-press disabled:opacity-50"
        >
          {joining === room.id ? '참여 중...' : '참여하기'}
        </button>
      )}
    </div>
  )
}

export default function Rooms({ currentUser, refreshUser }) {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(null)
  const [activeStatus, setActiveStatus] = useState(null)

  useEffect(() => {
    fetchRooms()
    fetchActiveStatus()
    const interval = setInterval(() => {
      fetchRooms()
      fetchActiveStatus()
    }, 5000)
    return () => clearInterval(interval)
  }, [currentUser?.id])

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

  async function fetchActiveStatus() {
    if (!currentUser?.id) return
    try {
      const data = await getActiveStatus(currentUser.id)
      setActiveStatus(data)
    } catch (err) {
      console.error('Active status fetch error:', err)
    }
  }

  async function handleJoin(roomId) {
    setJoining(roomId)
    try {
      await joinRoom(roomId, {
        userId: currentUser.id,
        name: currentUser.name,
        department: currentUser.department,
        matchCount: currentUser.matchCount || 0,
      })
      navigate(`/rooms/${roomId}`)
    } catch (err) {
      console.error('Join error:', err)
      alert(err.message || '참여에 실패했습니다')
    } finally {
      setJoining(null)
    }
  }

  // 현재 사용자가 다른 점심 활동에 참여 중인지 확인 (매칭 대기/방 참여/그룹 완료)
  const isBlocked = activeStatus?.active === true
  
  // 현재 사용자가 매칭 완료된 방에 참여하고 있는지 확인 (기존 호환용)
  const hasMatchedRoom = isBlocked || rooms.some(room => {
    const isFull = room.status === 'full' || room.members.length >= room.maxCount
    const isJoined = room.members.some(m => m.id === currentUser.id)
    return isFull && isJoined
  })

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
          <span>🏠</span> 오늘의 점심방
        </h1>
        {hasMatchedRoom ? (
          <button
            disabled
            className="flex items-center gap-1 px-4 py-2 bg-gray-300 text-gray-500 rounded-xl font-medium text-sm cursor-not-allowed"
          >
            <span>🔒</span> 방 만들기
          </button>
        ) : (
          <Link
            to="/rooms/create"
            className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium text-sm btn-press"
          >
            <span>+</span> 방 만들기
          </Link>
        )}
      </div>

      {/* 상태별 안내 메시지 */}
      {activeStatus?.active && activeStatus.type === 'waiting' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-blue-700 font-medium">
            ⏳ 점심 매칭이 진행 중입니다!
          </p>
          <p className="text-blue-600 text-sm mt-1">
            매칭 진행 중에는 다른 방에 참여할 수 없습니다.
          </p>
        </div>
      )}
      {activeStatus?.active && activeStatus.type === 'room' && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-center">
          <p className="text-sky-700 font-medium">
            🏠 이미 참여 중인 점심방이 있습니다!
          </p>
          <p className="text-sky-600 text-sm mt-1">
            다른 방 참여 및 방 만들기가 비활성화됩니다.
          </p>
        </div>
      )}
      {(activeStatus?.active && activeStatus.type === 'group') || (!activeStatus?.active && hasMatchedRoom) ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-green-700 font-medium">
            🎉 오늘 점심 매칭이 완료되었습니다!
          </p>
          <p className="text-green-600 text-sm mt-1">
            다른 방 참여 및 방 만들기가 비활성화됩니다.
          </p>
        </div>
      ) : null}

      {/* Rooms List */}
      {rooms.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <div className="text-5xl">🏠</div>
          <div className="text-gray-500">아직 열려있는 방이 없어요</div>
          {hasMatchedRoom ? (
            <button
              disabled
              className="inline-block px-6 py-3 bg-gray-300 text-gray-500 rounded-xl font-medium cursor-not-allowed"
            >
              🔒 방 만들기 불가
            </button>
          ) : (
            <Link
              to="/rooms/create"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-xl font-medium btn-press"
            >
              첫 번째 방 만들기
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 열린 방 섹션 */}
          {rooms.filter(r => r.status !== 'full' && r.members.length < r.maxCount).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                참여 가능한 방
              </h2>
              {rooms
                .filter(r => r.status !== 'full' && r.members.length < r.maxCount)
                .map(room => (
                  <RoomCard 
                    key={room.id} 
                    room={room} 
                    currentUser={currentUser}
                    joining={joining}
                    onJoin={handleJoin}
                    getLevelInfo={getLevelInfo}
                    menuLabels={menuLabels}
                    priceLabels={priceLabels}
                    activeStatus={activeStatus}
                  />
                ))
              }
            </div>
          )}

          {/* 매칭 완료 방 섹션 */}
          {rooms.filter(r => r.status === 'full' || r.members.length >= r.maxCount).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                매칭 완료
              </h2>
              {rooms
                .filter(r => r.status === 'full' || r.members.length >= r.maxCount)
                .map(room => (
                  <RoomCard 
                    key={room.id} 
                    room={room} 
                    currentUser={currentUser}
                    joining={joining}
                    onJoin={handleJoin}
                    getLevelInfo={getLevelInfo}
                    menuLabels={menuLabels}
                    priceLabels={priceLabels}
                    activeStatus={activeStatus}
                  />
                ))
              }
            </div>
          )}
        </div>
      )}

      {/* Refresh Hint */}
      <p className="text-center text-xs text-gray-400">
        5초마다 자동으로 새로고침됩니다
      </p>
    </div>
  )
}
