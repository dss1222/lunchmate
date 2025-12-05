import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createRoom } from '../api'

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

const maxCountOptions = [2, 3, 4, 5, 6]

export default function RoomCreate({ currentUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state?.prefill || {}

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    timeSlot: prefill.timeSlot || '12:00',
    menu: prefill.menu || '',
    priceRange: prefill.priceRange || 'mid',
    maxCount: 4,
  })

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('방 제목을 입력해주세요!')
      return
    }
    if (!formData.menu) {
      alert('메뉴를 선택해주세요!')
      return
    }

    setLoading(true)
    try {
      const room = await createRoom({
        ...formData,
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        creatorDepartment: currentUser.department,
        creatorMatchCount: currentUser.matchCount || 0,
      })
      navigate(`/rooms/${room.id}`)
    } catch (err) {
      console.error('Create room error:', err)
      alert('방 생성에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-2xl">←</button>
        <h1 className="text-xl font-bold">나만의 점심방 만들기</h1>
      </div>

      {/* Room Title */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>✏️</span> 방 제목
        </h2>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="예: 한식 먹을 사람 모여라~"
          className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          maxLength={30}
        />
        <p className="text-xs text-gray-400 mt-2 text-right">{formData.title.length}/30</p>
      </section>

      {/* Time Selection */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>⏰</span> 시간대
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

      {/* Menu Selection */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>🍽️</span> 메뉴
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {menuCategories.map(menu => (
            <button
              key={menu.id}
              onClick={() => setFormData(prev => ({ ...prev, menu: menu.id }))}
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

      {/* Price Range */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>💰</span> 가격대
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

      {/* Max Count */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>👥</span> 모집 인원
        </h2>
        <div className="flex gap-2">
          {maxCountOptions.map(count => (
            <button
              key={count}
              onClick={() => setFormData(prev => ({ ...prev, maxCount: count }))}
              className={`flex-1 py-3 rounded-xl font-medium transition-all btn-press ${
                formData.maxCount === count
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
              }`}
            >
              {count}명
            </button>
          ))}
        </div>
      </section>

      {/* Preview */}
      <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-5 border border-blue-100">
        <h3 className="font-bold text-gray-700 mb-2">📋 미리보기</h3>
        <p className="text-gray-600">
          <strong>{formData.title || '방 제목'}</strong>
        </p>
        <p className="text-sm text-gray-500">
          {formData.timeSlot} · {menuCategories.find(m => m.id === formData.menu)?.name || '메뉴 선택'} · {formData.maxCount}명 모집
        </p>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !formData.title.trim() || !formData.menu}
        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all btn-press ${
          loading || !formData.title.trim() || !formData.menu
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 hover:from-blue-600 hover:to-blue-700'
        }`}
      >
        {loading ? '생성 중...' : '🏠 방 만들기'}
      </button>
    </div>
  )
}
