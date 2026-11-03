import { Link } from 'react-router-dom'
import { ShieldIcon } from './Icons.jsx'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldIcon size={16} />
          <span>
            <b style={{ color: 'var(--text-soft)' }}>SafetyConnect</b> — Community safety, powered together.
          </span>
        </div>
        <nav>
          <Link to="/report">Report</Link>
          <Link to="/track">Track</Link>
          <Link to="/register">Register</Link>
        </nav>
        <span>© 2026 Precinct 12 · For emergencies call 112</span>
      </div>
    </footer>
  )
}