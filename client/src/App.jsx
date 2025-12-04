import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
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

// 데모용 샘플 유저
const sampleUsers = [
  { id: 'demo1', name: '김철수', department: 'AI팀', gender: 'male', age: 28, level: 'junior' },
  { id: 'demo2', name: '이영희', department: '개발팀', gender: 'female', age: 32, level: 'senior' },
  { id: 'demo3', name: '박지민', department: '디자인팀', gender: 'female', age: 26, level: 'junior' },
  { id: 'demo4', name: '최동욱', department: '마케팅팀', gender: 'male', age: 35, level: 'manager' },
  { id: 'demo5', name: '정수현', department: '컨설팅팀', gender: 'female', age: 29, level: 'senior' },
]

function App() {
  const [currentUser, setCurrentUser] = useState(sampleUsers[0])

  return (
    <Layout currentUser={currentUser} setCurrentUser={setCurrentUser} sampleUsers={sampleUsers}>
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
  )
}

export default App

