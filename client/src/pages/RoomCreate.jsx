import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createRoom, getNearbyRestaurants } from '../api'

const timeSlots = ['11:30', '12:00', '12:30', '13:00']

const priceRanges = [
  { id: 'low', label: '7천원 이하', emoji: '💰' },
  { id: 'mid', label: '7천 ~ 1.2만', emoji: '💵' },
  { id: 'high', label: '1.2만 이상', emoji: '💎' },
]

const menuCategories = [
  { id: 'korean', name: '한식', emoji: '🍚', keyword: '한식' },
  { id: 'japanese', name: '일식', emoji: '🍣', keyword: '일식' },
  { id: 'chinese', name: '중식', emoji: '🥟', keyword: '중식' },
  { id: 'western', name: '양식', emoji: '🍝', keyword: '양식' },
  { id: 'salad', name: '샐러드', emoji: '🥗', keyword: '샐러드' },
  { id: 'snack', name: '분식', emoji: '🍜', keyword: '분식' },
]

const sortOptions = [
  { id: 'distance', label: '거리순', icon: '📍' },
  { id: 'accuracy', label: '정확도순', icon: '🎯' },
]

const maxCountOptions = [2, 3, 4, 5, 6]

// 여의도 기본 좌표
const YEOUIDO_LOCATION = {
  latitude: 37.530230,
  longitude: 126.926439,
}

export default function RoomCreate({ currentUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state?.prefill || {}

  const [loading, setLoading] = useState(false)
  const [restaurantsLoading, setRestaurantsLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [detailRestaurant, setDetailRestaurant] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('distance')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    timeSlot: prefill.timeSlot || '12:00',
    menu: prefill.menu || '',
    priceRange: prefill.priceRange || 'mid',
    maxCount: 4,
  })

  const observerRef = useRef(null)

  // 식당 검색 함수
  const fetchRestaurants = useCallback(async (keyword, pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setRestaurantsLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const result = await getNearbyRestaurants({
        ...YEOUIDO_LOCATION,
        keyword: keyword || '맛집',
        radius: 2000,
        page: pageNum,
        size: 15,
      })

      const newRestaurants = result.restaurants || []
      
      if (append) {
        setRestaurants(prev => [...prev, ...newRestaurants])
      } else {
        setRestaurants(newRestaurants)
      }

      setHasMore(!result.meta?.isEnd && newRestaurants.length > 0)
      setPage(pageNum)
    } catch (err) {
      console.error('맛집 검색 실패:', err)
      if (!append) {
        setRestaurants([])
      }
      setHasMore(false)
    } finally {
      setRestaurantsLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // 메뉴 선택 시 검색
  useEffect(() => {
    if (!formData.menu) {
      setRestaurants([])
      setSelectedRestaurant(null)
      setSearchQuery('')
      setPage(1)
      setHasMore(true)
      return
    }

    const menuCategory = menuCategories.find(m => m.id === formData.menu)
    setSearchQuery('')
    fetchRestaurants(menuCategory?.keyword || '맛집', 1, false)
  }, [formData.menu, fetchRestaurants])

  // 검색어 변경 시 (디바운스)
  useEffect(() => {
    if (!formData.menu) return

    const timer = setTimeout(() => {
      const menuCategory = menuCategories.find(m => m.id === formData.menu)
      const keyword = searchQuery.trim() || menuCategory?.keyword || '맛집'
      fetchRestaurants(keyword, 1, false)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, formData.menu, fetchRestaurants])

  // 무한 스크롤 옵저버
  const lastRestaurantRef = useCallback(node => {
    if (restaurantsLoading || loadingMore) return
    
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        const menuCategory = menuCategories.find(m => m.id === formData.menu)
        const keyword = searchQuery.trim() || menuCategory?.keyword || '맛집'
        fetchRestaurants(keyword, page + 1, true)
      }
    })

    if (node) observerRef.current.observe(node)
  }, [restaurantsLoading, loadingMore, hasMore, page, searchQuery, formData.menu, fetchRestaurants])

  // 정렬된 식당 리스트
  const sortedRestaurants = [...restaurants].sort((a, b) => {
    if (sortBy === 'distance') {
      return a.distance - b.distance
    }
    return 0
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
      const roomData = {
        ...formData,
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        creatorDepartment: currentUser.department,
        creatorMatchCount: currentUser.matchCount || 0,
      }
      
      // 식당을 선택한 경우에만 추가
      if (selectedRestaurant) {
        roomData.restaurantInfo = {
          id: selectedRestaurant.id,
          name: selectedRestaurant.name,
          category: selectedRestaurant.category,
          address: selectedRestaurant.roadAddress || selectedRestaurant.address,
          phone: selectedRestaurant.phone,
          placeUrl: selectedRestaurant.placeUrl,
          distance: selectedRestaurant.distance,
        }
      }
      
      const room = await createRoom(roomData)
      navigate(`/rooms/${room.id}`)
    } catch (err) {
      console.error('Create room error:', err)
      alert(err.message || '방 생성에 실패했습니다')
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

      {/* Restaurant Selection - 메뉴 선택 후 표시 */}
      {formData.menu && (
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📍</span> 식당 선택 
            <span className="text-sm font-normal text-gray-500">(여의도 주변)</span>
          </h2>

          {/* 검색 바 */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="식당 이름으로 검색..."
                className="w-full px-4 py-3 pl-10 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>

          {/* 정렬 옵션 */}
          <div className="flex gap-2 mb-4">
            {sortOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  sortBy === option.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                }`}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
          
          {restaurantsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-500">맛집 검색 중...</span>
            </div>
          ) : sortedRestaurants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">🍽️</span>
              <p>검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sortedRestaurants.map((restaurant, index) => {
                const isLast = index === sortedRestaurants.length - 1
                return (
                  <div
                    key={restaurant.id}
                    ref={isLast ? lastRestaurantRef : null}
                    className={`p-4 rounded-xl transition-all cursor-pointer ${
                      selectedRestaurant?.id === restaurant.id
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div 
                        className="flex-1"
                        onClick={() => setSelectedRestaurant(restaurant)}
                      >
                        <p className={`font-bold ${selectedRestaurant?.id === restaurant.id ? 'text-white' : 'text-gray-800'}`}>
                          {restaurant.name}
                        </p>
                        <p className={`text-sm mt-1 ${selectedRestaurant?.id === restaurant.id ? 'text-white/80' : 'text-gray-500'}`}>
                          {restaurant.category}
                        </p>
                        <p className={`text-xs mt-1 ${selectedRestaurant?.id === restaurant.id ? 'text-white/70' : 'text-gray-400'}`}>
                          {restaurant.roadAddress || restaurant.address}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-sm font-medium ${selectedRestaurant?.id === restaurant.id ? 'text-white' : 'text-blue-600'}`}>
                          {restaurant.distance}m
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDetailRestaurant(restaurant)
                          }}
                          className={`text-xs px-2 py-1 rounded-lg transition-all ${
                            selectedRestaurant?.id === restaurant.id
                              ? 'bg-white/20 text-white hover:bg-white/30'
                              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          }`}
                        >
                          상세보기
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-500">더 불러오는 중...</span>
                </div>
              )}
              
              {!hasMore && sortedRestaurants.length > 0 && (
                <p className="text-center text-sm text-gray-400 py-4">
                  모든 식당을 불러왔습니다
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Restaurant Detail Modal */}
      {detailRestaurant && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailRestaurant(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{detailRestaurant.name}</h3>
                  <p className="text-white/80 text-sm mt-1">{detailRestaurant.category}</p>
                </div>
                <button 
                  onClick={() => setDetailRestaurant(null)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-sm text-gray-500">거리</p>
                  <p className="font-medium">{detailRestaurant.distance}m</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl">🏠</span>
                <div>
                  <p className="text-sm text-gray-500">주소</p>
                  <p className="font-medium">{detailRestaurant.roadAddress || detailRestaurant.address}</p>
                </div>
              </div>

              {detailRestaurant.phone && (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📞</span>
                  <div>
                    <p className="text-sm text-gray-500">전화번호</p>
                    <a href={`tel:${detailRestaurant.phone}`} className="font-medium text-blue-600 hover:underline">
                      {detailRestaurant.phone}
                    </a>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <p className="text-sm text-gray-600 mb-3">
                  📝 <strong>메뉴, 리뷰, 평점</strong>은 카카오맵에서 확인하세요!
                </p>
                <a
                  href={detailRestaurant.placeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold text-center rounded-xl transition-all"
                >
                  🗺️ 카카오맵에서 상세 정보 보기
                </a>
              </div>

              <button
                onClick={() => {
                  setSelectedRestaurant(detailRestaurant)
                  setDetailRestaurant(null)
                }}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all"
              >
                ✓ 이 식당 선택하기
              </button>
            </div>
          </div>
        </div>
      )}

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
        {selectedRestaurant && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-sm font-medium text-blue-700">
              🏪 {selectedRestaurant.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {selectedRestaurant.roadAddress || selectedRestaurant.address}
            </p>
          </div>
        )}
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
