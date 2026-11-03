import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import MapWidget from '../components/MapWidget.jsx'
import { useToasts } from '../components/Toasts.jsx'
import { dispatchUnit, getDispatchFeed, getStations, resolveReport, formatKm } from '../services/api.js'
import { socketService } from '../services/socket.js'
import {
  ShieldIcon,
  CarIcon,
  RouteIcon,
  PlayIcon,
  CameraIcon,
  VideoIcon,
  ClockIcon,
  MapPinIcon,
  CheckIcon,
  UserIcon,
  SirenIcon
} from '../components/Icons.jsx'

const fmt = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' })
}

const reporterMeta = (type) =>
  type === 'Anonymous'
    ? { label: 'Anonymous', tone: 'red' }
    : { label: 'Registered', tone: 'blue' }

export default function Dashboard() {
  const { isOfficer, user, enterDemoDispatch, logout } = useAuth()
  const navigate = useNavigate()

  const handleExit = () => {
    logout()
    navigate('/')
  }

  if (!isOfficer) return <Gate onEnter={enterDemoDispatch} />

  return <DispatchPortal officer={user} onLogout={handleExit} />
}

function Gate({ onEnter }) {
  return (
    <div className="page">
      <div className="gate container">
        <div className="card gate-card">
          <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,var(--blue),var(--cyan))' }}>
            <ShieldIcon size={32} />
          </div>
          <h1>Precinct 12 Dispatch Portal</h1>
          <p>
            Restricted area for verified officers. Sign in with your officer badge at <b>/login</b>, or use the
            simulated officer account below.
          </p>
          <button className="btn btn-blue btn-lg btn-block" onClick={onEnter}>
            <SirenIcon size={18} /> Enter Dispatch Portal (Demo)
          </button>
        </div>
      </div>
    </div>
  )
}

function DispatchPortal({ officer, onLogout }) {
  const { toast, render } = useToasts()
  const [incidents, setIncidents] = useState([])
  const [stations, setStations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [live, setLive] = useState(false)
  const simRef = useRef(null)

  useEffect(() => {
    let mounted = true
    getDispatchFeed().then((d) => {
      if (!mounted) return
      setIncidents(d)
      setSelectedId(d[0]?.id || null)
    })
    getStations().then((s) => mounted && setStations(s))

    const socket = socketService.connect()
    if (socket) {
      const onNew = (r) => setIncidents((prev) => [r, ...prev].slice(0, 40))
      const onUpdate = (r) =>
        setIncidents((prev) => prev.map((p) => (p.id === r.id ? { ...p, ...r } : p)))
      socketService.on('incident:new', onNew)
      socketService.on('incident:update', onUpdate)
      setLive(socketService.connected())

      const watchdog = setInterval(() => {
        setLive(socketService.connected())
        if (socketService.connected()) {
          // live feed managed by server
        } else if (!simRef.current) {
          simRef.current = setInterval(() => {
            setIncidents((prev) => {
              const base = prev[0]
              if (!base) return prev
              const idx = (parseInt(base.id.replace(/\D/g, '') || '0', 10) + 1)
              const fresh = {
                ...base,
                id: 'INC-' + idx,
                token: 'REP-' + (1000 + idx) + '-' + String.fromCharCode(65 + (idx % 26)),
                status: 'Pending',
                latestUpdate: 'Report received',
                receivedAt: new Date(),
                description: 'Simulated live incident while the socket server is offline.'
              }
              return [fresh, ...prev].slice(0, 30)
            })
          }, 14000)
        }
      }, 5000)

      return () => {
        mounted = false
        clearInterval(watchdog)
        if (simRef.current) clearInterval(simRef.current)
        socketService.off('incident:new', onNew)
        socketService.off('incident:update', onUpdate)
      }
    }
    return () => {
      mounted = false
    }
  }, [])

  const selected = useMemo(() => incidents.find((i) => i.id === selectedId), [incidents, selectedId])

  const pinData = useMemo(() => {
    const inc = incidents.map((i) => ({
      id: i.id,
      lat: i.lat,
      lng: i.lng,
      title: i.category,
      label: i.id,
      status: i.status,
      size: 24
    }))
    const st = stations.map((s) => ({
      id: s.id,
      lat: s.lat,
      lng: s.lng,
      title: s.name,
      label: 'Station',
      status: 'Station',
      size: 22
    }))
    return [...inc, ...st]
  }, [incidents, stations])

  const handleAction = async (kind) => {
    if (!selected) return
    if (kind === 'dispatch') {
      const unit = `Unit ${(parseInt(selected.id.replace(/\D/g, '') || '1', 10) % 5) + 1}`
      const res = await dispatchUnit({ id: selected.id, unit })
      setIncidents((prev) =>
        prev.map((p) =>
          p.id === selected.id
            ? { ...p, status: 'In Progress', latestUpdate: res.latestUpdate }
            : p
        )
      )
      toast.info(`🚓 ${res.latestUpdate}`)
    } else {
      const res = await resolveReport(selected.id)
      setIncidents((prev) =>
        prev.map((p) => (p.id === selected.id ? { ...p, status: 'Resolved', latestUpdate: res.latestUpdate } : p))
      )
      toast.success(`✔ ${res.latestUpdate}`)
    }
  }

  return (
    <div className="page container">
      <div className="dash-header">
        <div>
          <h1>
            <ShieldIcon size={22} style={{ color: 'var(--blue-bright)' }} />
            Precinct 12 Dispatch Portal
          </h1>
          <div className="sub">
            {incidents.length} active incidents · {live ? '● Socket.io LIVE' : '○ Offline simulation'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="officer-tag">
            <ShieldIcon size={15} />
            Officer {officer?.fullName} ({officer?.badge})
          </span>
          <button className="btn btn-ghost" onClick={onLogout}>
            Exit portal
          </button>
        </div>
      </div>

      <div className="dash-layout">
        {/* Left column */}
        <div className="map-stack">
          <div className="card panel-pad">
            <div className="section-head" style={{ marginBottom: 12 }}>
              <div>
                <h2>Live Dispatch Map</h2>
                <p>Color-coded incidents and stations across the precinct.</p>
              </div>
            </div>
            <div className="map-canvas">
              <MapWidget pins={pinData} height="clamp(320px, 52vh, 430px)" />
            </div>
            <div className="map-legend">
              <span className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--red-bright)' }} /> Pending
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--amber-bright)' }} /> In progress / assigned
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--blue-bright)' }} /> Station
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--green-bright)' }} /> Resolved
              </span>
            </div>
          </div>

          <div className="card queue-card">
            <div className="inspector-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ClockIcon size={18} style={{ color: 'var(--green-bright)' }} />
                <div>
                  <div className="card-title">Real-time incident queue</div>
                  <div className="card-sub">Updated via Socket.io</div>
                </div>
              </div>
              <span className="pill" style={live ? { background: 'rgba(22,163,74,.14)', color: 'var(--green-bright)', border: '1px solid rgba(34,197,94,.4)' } : { background: 'rgba(148,163,184,.12)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                <span className="pill-dot" /> {live ? 'LIVE' : 'DEMO'}
              </span>
            </div>
            <div className="queue-table-wrap">
              <table className="queue-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Time Received</th>
                    <th>Reporter Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => {
                    const rep = reporterMeta(inc.reporterType)
                    return (
                      <tr key={inc.id} className={selectedId === inc.id ? 'selected' : ''} onClick={() => setSelectedId(inc.id)}>
                        <td className="mono" style={{ color: 'var(--blue-bright)' }}>{inc.id}</td>
                        <td><b>{inc.category}</b></td>
                        <td style={{ color: 'var(--muted)' }}>{inc.address}</td>
                        <td className="mono">{fmt(inc.receivedAt)}</td>
                        <td>
                          <span className={`pill ${rep.tone}`}>
                            <span className="pill-dot" /> {rep.label}
                          </span>
                        </td>
                        <td>
                          <span className={`pill ${inc.status === 'Resolved' ? 'green' : inc.status === 'Pending' ? 'red' : inc.status === 'Assigned' ? 'blue' : 'amber'}`}>
                            <span className="pill-dot" /> {inc.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Inspector panel */}
        <aside className="card inspector" style={{ alignSelf: 'start' }}>
          <div className="inspector-head">
            <div>
              <div className="card-title">Inspector</div>
              <div className="card-sub">{selected ? `Reviewing ${selected.id}` : 'Select an incident'}</div>
            </div>
            {selected && (
              <span className={`pill ${selected.status === 'Resolved' ? 'green' : selected.status === 'Pending' ? 'red' : selected.status === 'Assigned' ? 'blue' : 'amber'}`}>
                <span className="pill-dot" /> {selected.status}
              </span>
            )}
          </div>

          {selected ? (
            <>
              <div className="inspector-media">
                <div className="media-frame">
                  {selected.media?.length ? (
                    selected.media[0].type === 'video' ? (
                      <>
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg,#0b1220,#030712)', display: 'grid', placeItems: 'center' }}>
                          <VideoIcon size={44} style={{ color: 'var(--muted)' }} />
                        </div>
                        <button className="play"><PlayIcon size={22} /></button>
                        <span className="media-name" style={{ position: 'absolute', bottom: 8, left: 10, background: 'rgba(0,0,0,.7)', padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontFamily: 'var(--mono)' }}>
                          ▶ VID preview
                        </span>
                      </>
                    ) : (
                      <>
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg,#132544,#0b1220)', display: 'grid', placeItems: 'center' }}>
                          <CameraIcon size={44} style={{ color: 'var(--muted)' }} />
                        </div>
                        <span className="media-name" style={{ position: 'absolute', bottom: 8, left: 10, background: 'rgba(0,0,0,.7)', padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontFamily: 'var(--mono)' }}>
                          🖼 PHOTO preview
                        </span>
                      </>
                    )
                  ) : (
                    <div style={{ display: 'grid', placeItems: 'center', gap: 8, color: 'var(--faint)' }}>
                      <FilePlaceholder />
                      <span style={{ fontSize: 12 }}>No media attached</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="inspector-detail">
                <div className="row">
                  <span>Category</span>
                  <b>{selected.category}</b>
                </div>
                <div className="row">
                  <span>Location</span>
                  <b style={{ display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'flex-end' }}>
                    <MapPinIcon size={13} /> {selected.address}
                  </b>
                </div>
                <div className="row">
                  <span>Station</span>
                  <b style={{ display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'flex-end' }}>
                    <ShieldIcon size={13} /> {selected.station?.name || 'Unassigned'}
                  </b>
                </div>
                <div className="row">
                  <span>Coordinates</span>
                  <b className="mono">{selected.lat?.toFixed(4)}, {selected.lng?.toFixed(4)}</b>
                </div>
                <div className="row">
                  <span>Received</span>
                  <b>{fmt(selected.receivedAt)}</b>
                </div>
                <div className="row">
                  <span>Reporter</span>
                  <b>{selected.reporterType}</b>
                </div>
                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 10, color: 'var(--text-soft)', fontSize: 12.5, lineHeight: 1.5 }}>
                  {selected.description}
                </div>
              </div>

              <div className="route-box">
                <RouteIcon size={17} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  {selected.station ? (
                    <>
                      <b>Nearest station:</b> {selected.station.name} ·{' '}
                      {formatKm(selected.station.distanceKm)} from the incident
                    </>
                  ) : (
                    'No police station has been assigned to this incident yet.'
                  )}
                </span>
              </div>

              {selected.media?.length > 1 && (
                <div style={{ padding: '0 18px', display: 'flex', gap: 8 }}>
                  {selected.media.map((m, i) => (
                    <span key={i} className="pill blue" style={{ cursor: 'pointer' }}>
                      {m.type === 'video' ? <VideoIcon size={12} /> : <CameraIcon size={12} />} {m.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="latest-update" style={{ margin: '0 18px', background: 'rgba(245,158,11,.08)', borderColor: 'rgba(245,158,11,.35)', color: 'var(--amber-bright)' }}>
                <ClockIcon size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <span><b>Latest:</b> {selected.latestUpdate}</span>
              </div>

              <div className="inspector-actions">
                <button className="btn btn-blue" disabled={selected.status === 'Resolved'} onClick={() => handleAction('dispatch')}>
                  <CarIcon size={16} /> Dispatch Unit
                </button>
                <button className="btn btn-green" disabled={selected.status === 'Resolved'} onClick={() => handleAction('resolve')}>
                  <CheckIcon size={16} /> Resolve
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>
              <UserIcon size={32} style={{ margin: '0 auto 10px' }} />
              No incident selected
            </div>
          )}
        </aside>
      </div>

      {render()}
    </div>
  )
}

function FilePlaceholder() {
  return <CameraIcon size={34} style={{ margin: '0 auto' }} />
}