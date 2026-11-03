import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ShieldIcon, SirenIcon, MenuIcon, LogoutIcon, UserIcon } from './Icons.jsx'

const links = [
  { to: '/', label: 'Home' },
  { to: '/report', label: 'Report Incident' },
  { to: '/track', label: 'Track Status' }
]

export default function Header() {
  const { user, isOfficer, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const signedCitizen = !!user && !isOfficer

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-badge">
            <ShieldIcon size={20} />
          </span>
          <span>
            Safety<em>Connect</em>
          </span>
        </Link>

        <nav className={`nav-links${open ? ' open' : ''}`}>
          {isOfficer ? (
            <NavLink to="/dashboard" className="nav-link" onClick={() => setOpen(false)}>
              <ShieldIcon size={16} /> Dispatch Portal
            </NavLink>
          ) : (
            links
              .filter((l) => !(signedCitizen && l.to === '/'))
              .map((l) => (
                <NavLink key={l.to} to={l.to} end={l.to === '/'} className="nav-link" onClick={() => setOpen(false)}>
                  {l.label}
                </NavLink>
              ))
          )}
        </nav>

        <div className="nav-actions">
          {!isOfficer && (
            <Link to="/report" className="btn btn-sos">
              <SirenIcon size={16} /> SOS
            </Link>
          )}

          {user ? (
            <span className="user-chip">
              <span className="user-avatar">
                {isOfficer ? 'P' : user.fullName ? user.fullName.charAt(0) : 'U'}
              </span>
              <span className="user-chip-name">
                {isOfficer ? `${user.fullName} (${user.badge})` : user.fullName || user.email}
              </span>
            </span>
          ) : (
            <Link to="/register" className="btn btn-blue">
              <UserIcon size={16} /> Login
            </Link>
          )}

          {user && (
            <button
              className="btn btn-ghost"
              style={{ padding: '8px 12px' }}
              onClick={() => {
                logout()
                navigate('/')
              }}
              title="Sign out"
            >
              <LogoutIcon size={16} />
            </button>
          )}

          <button className="menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            <MenuIcon size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}