import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getGroup, getNearbyRestaurants } from '../api'

const priceLabels = {
  low: '7천원 이하',
  mid: '7천 ~ 1.2만',
  high: '1.2만 이상',
}

const menuLabels = {
  korean: { name: '한식', keyword: '한식', emoji: '🍚' },
  japanese: { name: '일식', keyword: '일식', emoji: '🍣' },
  chinese: { name: '중식', keyword: '중식', emoji: '🥟' },
  western: { name: '양식', keyword: '양식', emoji: '🍝' },
  salad: { name: '샐러드', keyword: '샐러드', emoji: '🥗' },
  snack: { name: '분식', keyword: '분식', emoji: '🍜' },
}

// 여의도 기본 좌표
const YEOUIDO_LOCATION = {
  latitude: 37.530230,
  longitude: 126.926439,
}

export default function Result({ currentUser, refreshUser }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')

  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [restaurantsLoading, setRestaurantsLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [detailRestaurant, setDetailRestaurant] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  const observerRef = useRef(null)

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

  // 그룹 정보 로드 후 카카오 API로 식당 검색
  useEffect(() => {
    if (group?.menu) {
      fetchRestaurants(group.menu, '', 1, false)
    }
  }, [group?.menu])

  // 검색어 변경 시 (디바운스)
  useEffect(() => {
    if (!group?.menu) return

    const timer = setTimeout(() => {
      fetchRestaurants(group.menu, searchQuery.trim(), 1, false)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, group?.menu])

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

  const fetchRestaurants = useCallback(async (menu, query = '', pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setRestaurantsLoading(true)
    } else {
      setLoadingMore(true)
    }
    
    try {
      const menuInfo = menuLabels[menu]
      // 검색어가 있으면 검색어 우선, 없으면 메뉴 카테고리 기반
      const keyword = query || menuInfo?.keyword || '맛집'
      
      const result = await getNearbyRestaurants({
        ...YEOUIDO_LOCATION,
        keyword,
        radius: 2000,
        page: pageNum,
        size: 15,
      })
      const restaurantList = result.restaurants || []
      
      if (append) {
        setRestaurants(prev => [...prev, ...restaurantList])
      } else {
        setRestaurants(restaurantList)
        // 첫 번째 식당을 추천 식당으로 선택
        if (restaurantList.length > 0) {
          setSelectedRestaurant(restaurantList[0])
        }
      }
      
      setHasMore(!result.meta?.isEnd && restaurantList.length > 0)
      setPage(pageNum)
    } catch (err) {
      console.error('Restaurant fetch error:', err)
      if (!append) {
        setRestaurants([])
      }
      setHasMore(false)
    } finally {
      setRestaurantsLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // 무한 스크롤 옵저버
  const lastRestaurantRef = useCallback(node => {
    if (restaurantsLoading || loadingMore) return
    
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && group?.menu) {
        fetchRestaurants(group.menu, searchQuery.trim(), page + 1, true)
      }
    })

    if (node) observerRef.current.observe(node)
  }, [restaurantsLoading, loadingMore, hasMore, page, group?.menu, searchQuery, fetchRestaurants])

  const handleShare = async () => {
    const menuInfo = menuLabels[group.menu] || { name: group.menu }
    const restaurantName = selectedRestaurant?.name || '추천 식당'
    const shareText = `🍱 점심 매칭 완료!\n\n⏰ ${group.timeSlot}\n🍽️ ${menuInfo.name}\n📍 ${restaurantName}\n\n참여자: ${group.members.map(m => m.name).join(', ')}`
    
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

  const menuInfo = menuLabels[group.menu] || { name: group.menu, emoji: '🍽️' }

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
              {member.userId === currentUser.id && (
                <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  나
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Restaurant Recommendation - 카카오 API 연동 */}
      <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-5 border border-blue-100">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🍽️</span> 추천 식당
          <span className="text-sm font-normal text-gray-500">({menuInfo.name})</span>
        </h2>
        
        {restaurantsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-500">맛집 검색 중...</span>
          </div>
        ) : selectedRestaurant ? (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{selectedRestaurant.name}</h3>
                {selectedRestaurant.category && (
                  <p className="text-sm text-gray-500 mt-1">{selectedRestaurant.category}</p>
                )}
                {(selectedRestaurant.roadAddress || selectedRestaurant.address) && (
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedRestaurant.roadAddress || selectedRestaurant.address}
                  </p>
                )}
              </div>
              {selectedRestaurant.distance && (
                <div className="text-sm font-medium text-blue-600">
                  {selectedRestaurant.distance}m
                </div>
              )}
            </div>
            {selectedRestaurant.placeUrl && (
              <a
                href={selectedRestaurant.placeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-medium text-center rounded-lg text-sm transition-all"
              >
                🗺️ 카카오맵에서 보기
              </a>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <span className="text-2xl">{menuInfo.emoji}</span>
            <p className="mt-2">주변에서 {menuInfo.name} 맛집을 찾아보세요!</p>
          </div>
        )}
      </div>

      {/* Other Restaurants - 카카오 API 결과 + 검색 + 무한 스크롤 */}
      {group?.menu && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📋</span> 다른 추천 식당
          </h2>
          
          {/* 검색창 */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="식당 이름으로 검색..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {restaurants.length === 0 && !restaurantsLoading && (
              <p className="text-center text-gray-500 py-4">
                검색 결과가 없습니다
              </p>
            )}
            
            {restaurants.map((restaurant, index) => {
              const isLast = index === restaurants.length - 1
              return (
                <div 
                  key={restaurant.id}
                  ref={isLast ? lastRestaurantRef : null}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    selectedRestaurant?.id === restaurant.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                  onClick={() => setSelectedRestaurant(restaurant)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className={`font-medium ${selectedRestaurant?.id === restaurant.id ? 'text-white' : 'text-gray-700'}`}>
                        {restaurant.name}
                      </div>
                      <div className={`text-xs mt-0.5 ${selectedRestaurant?.id === restaurant.id ? 'text-white/70' : 'text-gray-500'}`}>
                        {restaurant.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${selectedRestaurant?.id === restaurant.id ? 'text-white' : 'text-blue-600'}`}>
                        {restaurant.distance}m
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDetailRestaurant(restaurant)
                        }}
                        className={`text-xs px-2 py-1 rounded-lg ${
                          selectedRestaurant?.id === restaurant.id
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        상세
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* 로딩 더보기 인디케이터 */}
            {loadingMore && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-500">더 불러오는 중...</span>
              </div>
            )}
            
            {!hasMore && restaurants.length > 0 && (
              <p className="text-center text-sm text-gray-400 py-4">
                모든 식당을 불러왔습니다
              </p>
            )}
          </div>
        </div>
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
                ✓ 이 식당으로 결정
              </button>
            </div>
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
