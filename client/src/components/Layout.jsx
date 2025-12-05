import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children, currentUser, onLogout }) {
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navItems = [
    { path: '/', label: '홈', icon: '🏠' },
    { path: '/rooms', label: '점심방', icon: '🍽️' },
    { path: '/dashboard', label: '통계', icon: '📊' },
  ]

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      onLogout()
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-orange-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🍱</span>
            <span className="font-bold text-xl gradient-text">LunchMate</span>
          </Link>
          
          {/* 사용자 정보 & 로그아웃 */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-white/80 border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {currentUser?.name?.[0] || '?'}
              </div>
              <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                {currentUser?.name || '사용자'}
              </span>
              <span className="text-gray-400 text-xs">▼</span>
            </button>

            {/* 드롭다운 메뉴 */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  {/* 사용자 정보 */}
                  <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-accent-50 border-b border-gray-100">
                    <div className="font-medium text-gray-800">{currentUser?.name}</div>
                    <div className="text-sm text-gray-500">{currentUser?.department}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {currentUser?.level === 'junior' && '사원'}
                      {currentUser?.level === 'senior' && '대리/선임'}
                      {currentUser?.level === 'manager' && '과장/팀장'}
                      {currentUser?.level === 'intern' && '인턴'}
                      {currentUser?.level === 'executive' && '임원'}
                    </div>
                  </div>
                  
                  {/* 메뉴 아이템들 */}
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <span>🚪</span>
                      <span>로그아웃</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="glass sticky bottom-0 border-t border-orange-100">
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex justify-around items-center">
            {navItems.map(item => {
              const isActive = location.pathname === item.path || 
                (item.path === '/rooms' && location.pathname.startsWith('/rooms'))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-primary-100 text-primary-600' 
                      : 'text-gray-500 hover:text-primary-500 hover:bg-primary-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
