import { useState, useEffect, useRef, useCallback } from 'react'
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

const TOTAL_TIMEOUT = 300 // 5분 = 300초
const RELAXATION_INTERVAL = 60 // 1분마다 조건 완화

export default function Matching({ currentUser }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const matchRequestId = searchParams.get('matchRequestId')
  const formData = location.state?.formData || {}

  const [status, setStatus] = useState('waiting')
  const [waitingCount, setWaitingCount] = useState(1)
  const [elapsed, setElapsed] = useState(0)
  const [relaxationLevel, setRelaxationLevel] = useState(0)
  const [relaxationMessage, setRelaxationMessage] = useState(null)
  
  // elapsed를 ref로 관리하여 useEffect 재실행 방지
  const elapsedRef = useRef(0)
  const isMatchedRef = useRef(false)

  // 매칭 상태 확인 함수
  const checkMatchStatus = useCallback(async () => {
    if (isMatchedRef.current) return
    
    try {
      const result = await getMatchStatus(matchRequestId, elapsedRef.current)
      
      if (result.status === 'matched') {
        isMatchedRef.current = true
        navigate(`/result?groupId=${result.groupId}`)
      } else if (result.status === 'timeout') {
        isMatchedRef.current = true
        navigate('/fail', { state: { reason: 'timeout', formData } })
      } else if (result.status === 'waiting') {
        setWaitingCount(result.waitingCount || 1)
        setRelaxationLevel(result.relaxationLevel || 0)
        setRelaxationMessage(result.relaxationMessage)
      } else if (result.status === 'not_found') {
        isMatchedRef.current = true
        navigate('/fail', { state: { reason: 'not_found', formData } })
      }
    } catch (err) {
      console.error('Poll error:', err)
    }
  }, [matchRequestId, navigate, formData])

  useEffect(() => {
    if (!matchRequestId) {
      navigate('/join')
      return
    }

    // 초기 상태 확인
    checkMatchStatus()

    // 상태 폴링 (2초마다)
    const pollInterval = setInterval(checkMatchStatus, 2000)

    // 경과 시간 카운터 (1초마다)
    const timerInterval = setInterval(() => {
      elapsedRef.current += 1
      setElapsed(elapsedRef.current)
      
      if (elapsedRef.current >= TOTAL_TIMEOUT && !isMatchedRef.current) {
        isMatchedRef.current = true
        clearInterval(pollInterval)
        clearInterval(timerInterval)
        navigate('/fail', { state: { reason: 'timeout', formData } })
      }
    }, 1000)

    return () => {
      clearInterval(pollInterval)
      clearInterval(timerInterval)
    }
  }, [matchRequestId, navigate, formData, checkMatchStatus])

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

  // 선택된 선호 조건들
  const preferences = formData.preferences || {}
  const hasPreferences = preferences.similarAge || preferences.sameGender || preferences.sameLevel

  // 현재 단계에서 완화된 조건들
  const getRelaxedConditions = () => {
    const conditions = []
    if (preferences.sameGender) conditions.push({ key: 'gender', label: '성별', icon: '👤' })
    if (preferences.similarAge) conditions.push({ key: 'age', label: '나이', icon: '👥' })
    if (preferences.sameLevel) conditions.push({ key: 'level', label: '직급', icon: '💼' })
    return conditions
  }

  const allConditions = getRelaxedConditions()
  const remainingConditions = allConditions.slice(relaxationLevel)
  const relaxedConditions = allConditions.slice(0, relaxationLevel)

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
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

      {/* Relaxation Message */}
      {relaxationMessage && (
        <div className="w-full max-w-sm bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div className="text-left">
              <p className="text-sm text-yellow-800 font-medium">{relaxationMessage}</p>
            </div>
          </div>
        </div>
      )}

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

        {/* 선호 조건 상태 */}
        {hasPreferences && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-2">선호 조건</h4>
            <div className="flex flex-wrap gap-2">
              {remainingConditions.map(cond => (
                <span key={cond.key} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                  <span>{cond.icon}</span>
                  <span>{cond.label}</span>
                  <span className="text-primary-400">✓</span>
                </span>
              ))}
              {relaxedConditions.map(cond => (
                <span key={cond.key} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-sm line-through">
                  <span>{cond.icon}</span>
                  <span>{cond.label}</span>
                </span>
              ))}
            </div>
          </div>
        )}
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
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-600">{formatTime(TOTAL_TIMEOUT - elapsed)}</div>
          <div className="text-xs text-gray-500">남은 시간</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-sm">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-400 via-primary-500 to-accent-500 transition-all duration-1000"
            style={{ width: `${Math.min((elapsed / TOTAL_TIMEOUT) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>0:00</span>
          {hasPreferences && (
            <>
              <span className={elapsed >= 60 ? 'text-yellow-500 font-medium' : ''}>1:00</span>
              <span className={elapsed >= 120 ? 'text-yellow-500 font-medium' : ''}>2:00</span>
              <span className={elapsed >= 180 ? 'text-yellow-500 font-medium' : ''}>3:00</span>
            </>
          )}
          <span>5:00</span>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          {hasPreferences 
            ? '1분마다 조건을 완화하며 최대 5분간 매칭합니다'
            : '최대 5분간 매칭을 시도합니다'
          }
        </p>
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
