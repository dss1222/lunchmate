import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      setError('아이디와 비밀번호를 입력해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await login(formData.username, formData.password)
      onLogin(result.user)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🍱</div>
        <h1 className="text-3xl font-bold gradient-text">LunchMate</h1>
        <p className="text-gray-500 mt-2">혼밥 탈출! 같이 점심 먹을 사람 찾기</p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="bg-white/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-center text-gray-800 mb-4">로그인</h2>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-200 btn-press disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-500">
            아직 계정이 없으신가요?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

