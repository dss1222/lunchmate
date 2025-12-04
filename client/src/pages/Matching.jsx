import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { getMatchStatus, cancelMatch } from '../api'

const menuLabels = {
  korean: '한식',
  japanese: '일식',
  chinese: '중식',
  western: '양식',
  salad: '샐러드',
  snack: '분식',
}

const priceLabels = {
  low: '7천원 이하',
  mid: '7천 ~ 1.2만',
  high: '1.2만 이상',
}

export default function Matching({ currentUser }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const matchRequestId = searchParams.get('matchRequestId')
  const formData = location.state?.formData || {}

  const [status, setStatus] = useState('waiting')
  const [waitingCount, setWaitingCount] = useState(1)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!matchRequestId) {
      navigate('/join')
      return
    }

    // 상태 폴링
    const pollInterval = setInterval(async () => {
      try {
        const result = await getMatchStatus(matchRequestId)
        
        if (result.status === 'matched') {
          clearInterval(pollInterval)
          navigate(`/result?groupId=${result.groupId}`)
        } else if (result.status === 'waiting') {
          setWaitingCount(result.waitingCount || 1)
        } else if (result.status === 'not_found') {
          clearInterval(pollInterval)
          navigate('/fail', { state: { reason: 'not_found', formData } })
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    }, 2000)

    // 경과 시간 카운터
    const timerInterval = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)

    // 60초 후 타임아웃
    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
      clearInterval(timerInterval)
      navigate('/fail', { state: { reason: 'timeout', formData } })
    }, 60000)

    return () => {
      clearInterval(pollInterval)
      clearInterval(timerInterval)
      clearTimeout(timeout)
    }
  }, [matchRequestId, navigate, formData])

  const handleCancel = async () => {
    try {
      await cancelMatch(matchRequestId)
      navigate('/join')
    } catch (err) {
      console.error('Cancel error:', err)
      navigate('/join')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
      {/* Loading Animation */}
      <div className="relative">
        <div className="text-7xl animate-bounce-slow">🍱</div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-200 rounded-full blur-sm animate-pulse"></div>
      </div>

      {/* Status Text */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-800">
          매칭 중입니다<span className="loading-dots"></span>
        </h1>
        <p className="text-gray-500">
          같은 조건의 동료를 찾고 있어요
        </p>
      </div>

      {/* Conditions Card */}
      <div className="w-full max-w-sm bg-white/80 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-medium text-gray-500 mb-3">선택한 조건</h3>
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">⏰</span>
            <span className="text-gray-700">{formData.timeSlot || '12:00'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">💰</span>
            <span className="text-gray-700">{priceLabels[formData.priceRange] || '7천 ~ 1.2만'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">🍽️</span>
            <span className="text-gray-700">{menuLabels[formData.menu] || '미선택'}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">{waitingCount}</div>
          <div className="text-xs text-gray-500">대기 중인 사람</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{formatTime(elapsed)}</div>
          <div className="text-xs text-gray-500">경과 시간</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-sm">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-1000"
            style={{ width: `${Math.min((elapsed / 60) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">최대 1분간 매칭을 시도합니다</p>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => navigate('/fail', { state: { reason: 'manual', formData } })}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors btn-press"
        >
          조건 변경하기
        </button>
        <button
          onClick={handleCancel}
          className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          매칭 취소
        </button>
      </div>
    </div>
  )
}

