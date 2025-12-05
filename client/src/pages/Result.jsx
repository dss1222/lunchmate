import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getGroup } from '../api'

const priceLabels = {
  low: '7천원 이하',
  mid: '7천 ~ 1.2만',
  high: '1.2만 이상',
}

const menuLabels = {
  korean: '한식',
  japanese: '일식',
  chinese: '중식',
  western: '양식',
  salad: '샐러드',
  snack: '분식',
}

export default function Result({ currentUser, refreshUser }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')

  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!groupId) {
      navigate('/')
      return
    }

    fetchGroup()
    // 매칭 완료 후 사용자 정보 새로고침 (매칭 횟수 반영)
    if (refreshUser) {
      refreshUser()
    }
  }, [groupId])

  async function fetchGroup() {
    try {
      const data = await getGroup(groupId)
      setGroup(data)
    } catch (err) {
      console.error('Group fetch error:', err)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    const shareText = `🍱 점심 매칭 완료!\n\n⏰ ${group.timeSlot}\n🍽️ ${menuLabels[group.menu]}\n📍 ${group.restaurant?.name}\n\n참여자: ${group.members.map(m => m.name).join(', ')}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LunchMate 매칭 완료!',
          text: shareText,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      // 복사
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

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">그룹 정보를 불러올 수 없습니다</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-500">
          홈으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center py-6">
        <div className="text-5xl mb-3 animate-bounce-slow">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">매칭 완료!</h1>
        <p className="text-gray-500">점심 그룹이 완성되었습니다</p>
      </div>

      {/* Members Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>👥</span> 참여자 ({group.members.length}명)
        </h2>
        <div className="space-y-3">
          {group.members.map((member, idx) => (
            <div 
              key={member.id || idx}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {member.name?.[0] || '?'}
              </div>
              <div>
                <div className="font-medium text-gray-800">{member.name}</div>
                <div className="text-sm text-gray-500">{member.department}</div>
              </div>
              {member.id === currentUser.id && (
                <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  나
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Restaurant Recommendation */}
      {group.restaurant && (
        <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-5 border border-blue-100">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🍽️</span> 추천 식당
          </h2>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{group.restaurant.name}</h3>
                <p className="text-sm text-gray-500">
                  도보 {group.restaurant.distance}분 · {priceLabels[group.restaurant.price]}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-lg">
                <span className="text-blue-500">⭐</span>
                <span className="font-medium text-blue-700">{group.restaurant.rating}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Restaurants */}
      {group.recommendedRestaurants?.length > 1 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📋</span> 다른 추천 식당
          </h2>
          <div className="space-y-2">
            {group.recommendedRestaurants.slice(1).map(restaurant => (
              <div key={restaurant.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-medium text-gray-700">{restaurant.name}</div>
                  <div className="text-xs text-gray-500">
                    도보 {restaurant.distance}분 · {priceLabels[restaurant.price]}
                  </div>
                </div>
                <div className="text-sm text-blue-600">⭐ {restaurant.rating}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meeting Info */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>📍</span> 약속 정보
        </h2>
        <div className="space-y-2 text-gray-700">
          <p className="flex items-center gap-2">
            <span>⏰</span>
            <span className="font-medium">{group.timeSlot}</span>
          </p>
          <p className="flex items-center gap-2">
            <span>📍</span>
            <span>본관 1층 로비에서 만나요!</span>
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleShare}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 btn-press"
        >
          {copied ? '✅ 복사됨!' : '📤 공유하기'}
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors btn-press"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}
