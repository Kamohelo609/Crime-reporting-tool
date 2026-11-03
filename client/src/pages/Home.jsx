import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import MapWidget from '../components/MapWidget.jsx'
import { publicIncidents, getMyReports, getPublicIncidents } from '../services/api.js'
import heroBg from '../assets/lmps. jpeg.webp'
import { useAuth } from '../context/AuthContext.jsx'
import {
  SirenIcon,
  SearchIcon,
  ClockIcon,
  MapPinIcon,
  ShieldIcon,
  CheckIcon,
  CrosshairIcon
} from '../components/Icons.jsx'

const stats = [
  { value: '1,240', label: 'Reports filed this month', tone: 'blue' },
  { value: '340', label: 'Units patrolling', tone: 'green' },
  { value: '12 min', label: 'Avg. dispatch response', tone: 'red' },
  { value: '96%', label: 'Cases tracked to close', tone: 'blue' }
]

const statusTone = (status) => {
  const s = (status || '').toLowerCase()
  if (s.includes('progress') || s.includes('assigned')) return 'amber'
  if (s.includes('resolved')) return 'green'
  if (s === 'pending' || s === 'received') return 'red'
  return 'blue'
}

function fmtDate(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

const heroStyle = {
  backgroundImage: `linear-gradient(rgba(250, 247, 240, 0.9), rgba(250, 247, 240, 0.94)), url("${heroBg}")`,
  backgroundSize: 'cover',
  backgroundPosition: 'center 25%',
  backgroundRepeat: 'no-repeat',
  borderBottom: '1px solid var(--border)'
}

export default function Home() {
  const [token, setToken] = useState('')
  const { user, isOfficer } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const myReportsRef = useRef(null)

  const signedCitizen = !!user && !isOfficer
  const myReports = useMemo(() => getMyReports(), [user])

  // Live public incidents from the API (falls back to bundled demo pins)
  const [livePins, setLivePins] = useState(publicIncidents)
  const activeCount = livePins.filter((p) => p.status !== 'Resolved').length

  // Show the visitor's location on the public map before they report anything.
  const [userCoords, setUserCoords] = useState(null)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState('')

  const locateMe = () => {
    if (!navigator.geolocation) {
      setGeoError('Location is not supported by this browser')
      return
    }
    setLocating(true)
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: +pos.coords.latitude.toFixed(6),
          lng: +pos.coords.longitude.toFixed(6)
        })
        setLocating(false)
      },
      () => {
        setLocating(false)
        setGeoError('Location permission denied')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  useEffect(() => {
    locateMe()
  }, [])

  useEffect(() => {
    let mounted = true
    getPublicIncidents()
      .then((d) => {
        if (mounted && Array.isArray(d) && d.length) setLivePins(d)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token')
    if (t) setToken(t)
  }, [])

  useEffect(() => {
    if (location.state?.focusMy && myReportsRef.current) {
      myReportsRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location.state])

  const submit = (e) => {
    e.preventDefault()
    if (!token.trim()) return
    navigate(`/track?token=${encodeURIComponent(token.trim())}`)
  }

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero container" style={heroStyle}>
        <div className="hero-flag">
          <span className="hero-dot" />
          LIVE — {activeCount} active incident{activeCount === 1 ? '' : 's'} in your area
        </div>
        <h1>
          Fast, Real-time <span className="hl-blue">Crime</span> &amp; <span className="hl-red">Incident</span> Reporting
        </h1>
        <p>
          Protect your community with instant incident submission and dispatch tracking. Report in seconds, follow
          every step until resolution.
        </p>
        <div className="hero-cta">
          <Link to="/report" className="btn btn-primary btn-lg">
            <SirenIcon size={18} /> Report an Incident
          </Link>
          {signedCitizen ? (
            <a
              href="#my-reports"
              className="btn btn-outline-blue btn-lg"
              onClick={(e) => {
                e.preventDefault()
                myReportsRef.current?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <ShieldIcon size={18} /> View My Reports
            </a>
          ) : (
            <Link to="/register" className="btn btn-blue btn-lg">
              Register Citizen Account
            </Link>
          )}
        </div>

        <div className="hero-stats">
          {stats.map((s) => (
            <div className="stat-box" key={s.label}>
              <b className={s.tone}>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Track search */}
      <section className="container">
        <form className="track-box" onSubmit={submit}>
          <SearchIcon size={18} style={{ margin: '0 0 0 18px', color: 'var(--faint)', alignSelf: 'center' }} />
          <input
            className="track-input"
            placeholder="Search anonymous token (e.g. REP-8921-X)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button className="track-search-btn" type="submit">
            <SearchIcon size={16} /> Track
          </button>
        </form>
      </section>

      {/* Map + your reports */}
      <section className="container home-split">
        <div className="card panel-pad">
          <div className="section-head">
            <div>
              <h2>Public Incident Map</h2>
              <p>Non-sensitive incidents reported near you, updated in real time.</p>
            </div>
          </div>
          <div className="map-toolbar">
            <span className="coord-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CrosshairIcon size={13} />
              {locating
                ? 'Finding your location…'
                : userCoords
                  ? `You are here · ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}`
                  : geoError || 'Location not shared'}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '6px 10px', fontSize: 12 }}
              onClick={locateMe}
              disabled={locating}
            >
              {userCoords ? 'Refresh location' : 'Use my location'}
            </button>
          </div>
          <div className="map-canvas">
            <MapWidget pins={livePins} height="clamp(280px, 46vh, 380px)" userLocation={userCoords} />
          </div>
          <div className="map-legend">
            <span className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--blue-bright)' }} /> You are here
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--red-bright)' }} /> Pending
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--amber-bright)' }} /> In progress
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--green-bright)' }} /> Resolved
            </span>
          </div>
        </div>

        <div className="card panel-pad" id="my-reports" ref={myReportsRef}>
          <div className="section-head">
            <div>
              <h2>{signedCitizen ? 'My Reports' : 'Your Recent Reports'}</h2>
              <p>Incidents you filed on this device — track each one with its anonymous token.</p>
            </div>
            <Link to="/report" className="btn btn-primary" style={{ whiteSpace: 'nowrap', padding: '9px 14px' }}>
              <SirenIcon size={15} /> New report
            </Link>
          </div>

          {myReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--muted)', fontSize: 14 }}>
              <ShieldIcon size={30} style={{ color: 'var(--faint)', margin: '0 auto 10px' }} />
              <p>You haven't filed any incidents yet.</p>
              <Link to="/report" className="btn btn-primary" style={{ marginTop: 16 }}>
                <SirenIcon size={16} /> Report an incident
              </Link>
            </div>
          ) : (
            <div className="my-reports">
              {myReports.slice(0, 6).map((r) => (
                <div className="feed-item" key={r.token}>
                  <span className={`feed-ico ${statusTone(r.status)}`}>
                    {r.status === 'Resolved' ? <CheckIcon size={18} /> : <MapPinIcon size={18} />}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <b>
                      {r.category}
                      <span className="mono" style={{ marginLeft: 10, color: 'var(--green-bright)', fontSize: 12 }}>
                        {r.token}
                      </span>
                    </b>
                    <p>
                      <span className={`pill ${statusTone(r.status)}`} style={{ marginRight: 8 }}>
                        <span className="pill-dot" /> {r.status}
                      </span>
                      {r.address}
                    </p>
                  </div>
                  <span className="feed-time" style={{ whiteSpace: 'nowrap' }}>
                    <ClockIcon size={12} style={{ verticalAlign: '-1px', marginRight: 3 }} />
                    {fmtDate(r.submittedAt)}
                  </span>
                  <Link to={`/track?token=${r.token}`} className="btn btn-ghost" style={{ padding: '7px 12px', marginLeft: 6 }}>
                    Track
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}