import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children, currentUser, setCurrentUser, sampleUsers }) {
  const location = useLocation()

  const navItems = [
    { path: '/', label: '홈', icon: '🏠' },
    { path: '/rooms', label: '점심방', icon: '🍽️' },
    { path: '/dashboard', label: '통계', icon: '📊' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-orange-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🍱</span>
            <span className="font-bold text-xl gradient-text">LunchMate</span>
          </Link>
          
          {/* 유저 선택 (데모용) */}
          <div className="flex items-center gap-2">
            <select
              value={currentUser.id}
              onChange={(e) => setCurrentUser(sampleUsers.find(u => u.id === e.target.value))}
              className="text-sm bg-white/80 border border-orange-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              {sampleUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} / {user.department}
                </option>
              ))}
            </select>
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

