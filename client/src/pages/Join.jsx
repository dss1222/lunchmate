import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { joinMatch, getActiveStatus } from '../api'

const timeSlots = ['11:30', '12:00', '12:30', '13:00']

const priceRanges = [
  { id: 'low', label: '7천원 이하', emoji: '💰' },
  { id: 'mid', label: '7천 ~ 1.2만', emoji: '💵' },
  { id: 'high', label: '1.2만 이상', emoji: '💎' },
]

const menuCategories = [
  { id: 'korean', name: '한식', emoji: '🍚' },
  { id: 'japanese', name: '일식', emoji: '🍣' },
  { id: 'chinese', name: '중식', emoji: '🥟' },
  { id: 'western', name: '양식', emoji: '🍝' },
  { id: 'salad', name: '샐러드', emoji: '🥗' },
  { id: 'snack', name: '분식', emoji: '🍜' },
]

export default function Join({ currentUser }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  
  const [formData, setFormData] = useState({
    timeSlot: '12:00',
    priceRange: 'mid',
    menu: '',
    preferences: {
      similarAge: false,
      sameGender: false,
      sameLevel: false,
    }
  })

  // 페이지 진입 시 활성 상태 체크
  useEffect(() => {
    async function checkActiveStatus() {
      if (!currentUser?.id) return
      try {
        const status = await getActiveStatus(currentUser.id)
        if (status?.active) {
          const typeNames = {
            waiting: '매칭 대기 중',
            room: '점심방에 참여 중',
            group: '점심 매칭이 완료된 상태'
          }
          alert(`이미 ${typeNames[status.type] || '점심 활동 중'}입니다. 먼저 기존 활동을 완료하거나 취소해주세요.`)
          navigate('/')
        }
      } catch (err) {
        console.error('Active status check error:', err)
      }
    }
    checkActiveStatus()
  }, [currentUser?.id, navigate])

  const handleMenuSelect = (menuId) => {
    setFormData(prev => ({ ...prev, menu: menuId }))
  }

  const handlePreferenceToggle = (key) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key]
      }
    }))
  }

  const handleSubmit = async () => {
    if (!formData.menu) {
      alert('메뉴를 선택해주세요!')
      return
    }

    setLoading(true)
    try {
      const result = await joinMatch({
        userId: currentUser.id,
        name: currentUser.name,
        department: currentUser.department,
        gender: currentUser.gender,
        age: currentUser.age,
        level: currentUser.level,
        ...formData,
      })

      if (result.status === 'matched') {
        navigate(`/result?groupId=${result.groupId}`)
      } else if (result.status === 'already_active') {
        // 이미 참여 중인 점심 활동이 있는 경우
        alert(result.message)
        if (result.activeType === 'room') {
          navigate(`/rooms/${result.activeId}`)
        } else if (result.activeType === 'group') {
          navigate(`/result?groupId=${result.activeId}`)
        }
      } else {
        navigate(`/matching?matchRequestId=${result.matchRequestId}`, {
          state: { formData }
        })
      }
    } catch (err) {
      console.error('Join error:', err)
      alert(err.message || '오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-2xl">←</button>
        <h1 className="text-xl font-bold">점심 같이 먹기 신청</h1>
      </div>

      {/* Time Selection */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>⏰</span> 시간대 선택
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map(time => (
            <button
              key={time}
              onClick={() => setFormData(prev => ({ ...prev, timeSlot: time }))}
              className={`py-3 rounded-xl font-medium transition-all btn-press ${
                formData.timeSlot === time
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </section>

      {/* Price Selection */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>💰</span> 가격대 선택
        </h2>
        <div className="space-y-2">
          {priceRanges.map(price => (
            <button
              key={price.id}
              onClick={() => setFormData(prev => ({ ...prev, priceRange: price.id }))}
              className={`w-full flex items-center gap-3 p-4 rounded-xl font-medium transition-all btn-press ${
                formData.priceRange === price.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
              }`}
            >
              <span className="text-xl">{price.emoji}</span>
              <span>{price.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Menu Selection */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>🍽️</span> 메뉴/카테고리 선택
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {menuCategories.map(menu => (
            <button
              key={menu.id}
              onClick={() => handleMenuSelect(menu.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl font-medium transition-all btn-press ${
                formData.menu === menu.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
              }`}
            >
              <span className="text-2xl">{menu.emoji}</span>
              <span className="text-sm">{menu.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Preferences (Expandable) */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowPreferences(!showPreferences)}
          className="w-full flex items-center justify-between p-5"
        >
          <div className="flex items-center gap-2">
            <span>⚙️</span>
            <span className="font-bold text-gray-800">추가 선호 설정</span>
            <span className="text-xs text-gray-400">(선택)</span>
          </div>
          <span className={`text-gray-400 transition-transform ${showPreferences ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {showPreferences && (
          <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500 mb-4">
              편안한 점심 시간을 위해 선호를 설정해주세요. 가능한 범위에서 반영됩니다.
            </p>
            
            {[
              { key: 'similarAge', label: '비슷한 또래와 함께', icon: '👥' },
              { key: 'sameGender', label: '같은 성별과 함께', icon: '👤' },
              { key: 'sameLevel', label: '비슷한 직급과 함께', icon: '💼' },
            ].map(pref => (
              <label
                key={pref.key}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.preferences[pref.key]}
                  onChange={() => handlePreferenceToggle(pref.key)}
                  className="w-5 h-5 rounded text-blue-500 focus:ring-blue-400"
                />
                <span className="text-lg">{pref.icon}</span>
                <span className="text-gray-700">{pref.label}</span>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !formData.menu}
        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all btn-press ${
          loading || !formData.menu
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 hover:from-blue-600 hover:to-blue-700'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            매칭 중...
          </span>
        ) : (
          '🚀 매칭 시작하기'
        )}
      </button>

      {/* Info */}
      <p className="text-center text-sm text-gray-500">
        같은 조건의 동료와 자동으로 매칭됩니다
      </p>
    </div>
  )
}
