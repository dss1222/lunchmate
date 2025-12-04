import { useNavigate, useLocation } from 'react-router-dom'

const reasonMessages = {
  timeout: '아직 같은 조건의 동료를 찾지 못했어요',
  not_found: '매칭 요청을 찾을 수 없습니다',
  manual: '매칭을 중단했습니다',
  default: '현재 조건에 맞는 인원이 부족해요',
}

export default function Fail({ currentUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const reason = location.state?.reason || 'default'
  const formData = location.state?.formData || {}

  const handleRetryWithSameConditions = () => {
    navigate('/join', { state: { prefill: formData } })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 px-4">
      {/* Icon */}
      <div className="text-6xl">😅</div>

      {/* Message */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-800">매칭이 어렵습니다</h1>
        <p className="text-gray-500">{reasonMessages[reason]}</p>
      </div>

      {/* Suggestions */}
      <div className="w-full max-w-sm bg-white/80 rounded-2xl p-5 shadow-sm text-left">
        <h3 className="font-bold text-gray-700 mb-3">💡 이렇게 해보세요</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-primary-500">•</span>
            <span>가격대 범위를 넓혀보세요</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">•</span>
            <span>다른 시간대로 변경해보세요</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">•</span>
            <span>인기 메뉴를 선택해보세요</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500">•</span>
            <span>직접 점심방을 만들어 사람을 모아보세요</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleRetryWithSameConditions}
          className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 btn-press"
        >
          🔄 조건 완화하고 다시 시도
        </button>
        
        <button
          onClick={() => navigate('/rooms/create', { state: { prefill: formData } })}
          className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-white font-bold rounded-2xl shadow-lg shadow-accent-200 btn-press"
        >
          🏠 나만의 점심방 만들기
        </button>

        <button
          onClick={() => navigate('/rooms')}
          className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors btn-press"
        >
          📋 열려있는 점심방 보기
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          오늘은 그냥 혼밥할래요 🍚
        </button>
      </div>
    </div>
  )
}

