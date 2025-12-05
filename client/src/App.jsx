import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getStoredUser, logout as apiLogout, isLoggedIn } from './api'
import Layout from './components/Layout'
import Home from './pages/Home'
import Join from './pages/Join'
import Matching from './pages/Matching'
import Result from './pages/Result'
import Fail from './pages/Fail'
import Rooms from './pages/Rooms'
import RoomCreate from './pages/RoomCreate'
import RoomDetail from './pages/RoomDetail'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'

// 보호된 라우트 컴포넌트
function PrivateRoute({ children, user }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

// 로그인한 사용자는 접근 못하는 라우트 (로그인/회원가입)
function PublicOnlyRoute({ children, user }) {
  if (user) {
    return <Navigate to="/" replace />
  }
  return children
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 앱 시작 시 저장된 사용자 정보 복원
  useEffect(() => {
    if (isLoggedIn()) {
      const storedUser = getStoredUser()
      if (storedUser) {
        setCurrentUser(storedUser)
      }
    }
    setLoading(false)
  }, [])

  // 로그인 핸들러
  const handleLogin = (user) => {
    setCurrentUser(user)
  }

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await apiLogout()
    setCurrentUser(null)
  }

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-5xl animate-bounce">🍱</div>
      </div>
    )
  }

  return (
    <Routes>
      {/* 공개 라우트 (로그인/회원가입) */}
      <Route path="/login" element={
        <PublicOnlyRoute user={currentUser}>
          <Login onLogin={handleLogin} />
        </PublicOnlyRoute>
      } />
      <Route path="/register" element={
        <PublicOnlyRoute user={currentUser}>
          <Register />
        </PublicOnlyRoute>
      } />

      {/* 보호된 라우트 */}
      <Route path="/*" element={
        <PrivateRoute user={currentUser}>
          <Layout currentUser={currentUser} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Home currentUser={currentUser} />} />
              <Route path="/join" element={<Join currentUser={currentUser} />} />
              <Route path="/matching" element={<Matching currentUser={currentUser} />} />
              <Route path="/result" element={<Result currentUser={currentUser} />} />
              <Route path="/fail" element={<Fail currentUser={currentUser} />} />
              <Route path="/rooms" element={<Rooms currentUser={currentUser} />} />
              <Route path="/rooms/create" element={<RoomCreate currentUser={currentUser} />} />
              <Route path="/rooms/:roomId" element={<RoomDetail currentUser={currentUser} />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  )
}

export default App
