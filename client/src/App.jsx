import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import ReportCrime from './pages/ReportCrime.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import TrackStatus from './pages/TrackStatus.jsx'
import Dashboard from './pages/Dashboard.jsx'

function CitizenOnly({ children }) {
  const { isOfficer } = useAuth()
  return isOfficer ? <Navigate to="/dashboard" replace /> : children
}

function AlreadyAuthed({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  const onPortal = window.location.pathname.startsWith('/dashboard')

  return (
    <>
      {!onPortal && <Header />}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<CitizenOnly><Home /></CitizenOnly>} />
          <Route path="/report" element={<CitizenOnly><ReportCrime /></CitizenOnly>} />
          <Route path="/register" element={<CitizenOnly><AlreadyAuthed><Register /></AlreadyAuthed></CitizenOnly>} />
          <Route path="/login" element={<CitizenOnly><AlreadyAuthed><Login /></AlreadyAuthed></CitizenOnly>} />
          <Route path="/track" element={<CitizenOnly><TrackStatus /></CitizenOnly>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<CitizenOnly><Home /></CitizenOnly>} />
        </Routes>
      </main>
      {!onPortal && <Footer />}
    </>
  )
}