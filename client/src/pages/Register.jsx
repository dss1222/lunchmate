import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api'

const departments = [
  '보안사업본부',
  '미래보안사업본부',
  '기획실',
  '보안기술연구소',
  '품질관리부',
  '인사부',
  '재경부',
]
const levels = [
  { id: 'intern', label: '인턴' },
  { id: 'staff', label: '사원' },
  { id: 'assistant', label: '대리' },
  { id: 'manager', label: '과장' },
  { id: 'deputy', label: '차장' },
  { id: 'general', label: '부장' },
  { id: 'director', label: '이사' },
]
const genders = [
  { id: 'male', label: '남성' },
  { id: 'female', label: '여성' },
]

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: 계정정보, 2: 추가정보
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    name: '',
    department: '',
    level: '',
    gender: '',
    age: '',
  })

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('')
  }

  const handleStep1Submit = (e) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      setError('아이디와 비밀번호를 입력해주세요')
      return
    }
    
    if (formData.username.length < 4) {
      setError('아이디는 4자 이상이어야 합니다')
      return
    }
    
    if (formData.password.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다')
      return
    }
    
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }
    
    setStep(2)
  }

  const handleStep2Submit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.department || !formData.level || !formData.gender || !formData.age) {
      setError('모든 항목을 입력해주세요')
      return
    }

    const age = parseInt(formData.age)
    if (isNaN(age) || age < 18 || age > 100) {
      setError('올바른 나이를 입력해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      await register({
        username: formData.username,
        password: formData.password,
        name: formData.name,
        department: formData.department,
        level: formData.level,
        gender: formData.gender,
        age: age,
      })
      
      alert('회원가입이 완료되었습니다! 로그인해주세요.')
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🍱</div>
        <h1 className="text-2xl font-bold gradient-text">LunchMate</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
          step >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
        }`}>1</div>
        <div className={`w-12 h-1 ${step >= 2 ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
          step >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
        }`}>2</div>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm">
        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="bg-white/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-center text-gray-800 mb-2">계정 정보</h2>
            <p className="text-sm text-gray-500 text-center mb-4">로그인에 사용할 정보를 입력하세요</p>

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
                placeholder="4자 이상 입력"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="4자 이상 입력"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
              <input
                type="password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                placeholder="비밀번호를 다시 입력"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-200 btn-press"
            >
              다음 →
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="bg-white/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-center text-gray-800 mb-2">추가 정보</h2>
            <p className="text-sm text-gray-500 text-center mb-4">프로필 정보를 입력하세요</p>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="실명을 입력하세요"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="">부서 선택</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">직급</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="">직급 선택</option>
                {levels.map(level => (
                  <option key={level.id} value={level.id}>{level.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="">선택</option>
                  {genders.map(g => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="만 나이"
                  min="18"
                  max="100"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl btn-press"
              >
                ← 이전
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold rounded-xl shadow-lg shadow-accent-200 btn-press disabled:opacity-50"
              >
                {loading ? '가입 중...' : '가입하기'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-6">
          <p className="text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

