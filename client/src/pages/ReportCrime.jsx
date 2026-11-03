import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import MapPicker from '../components/MapPicker.jsx'
import MediaUploader from '../components/MediaUploader.jsx'
import { useToasts } from '../components/Toasts.jsx'
import {
  CATEGORIES,
  nearStreet,
  submitReport,
  getStations,
  stationsByDistance,
  formatKm,
  stations as fallbackStations
} from '../services/api.js'
import { MapPinIcon, CrosshairIcon, CheckIcon, SirenIcon, ShieldIcon } from '../components/Icons.jsx'

const CITIES = [
  { name: 'Maseru', lat: -29.3142, lng: 27.4833 },
  { name: 'Maputsoe (Leribe)', lat: -28.8866, lng: 27.8981 },
  { name: 'Teyateyaneng', lat: -29.1485, lng: 27.7407 },
  { name: 'Mafeteng', lat: -29.823, lng: 27.235 },
  { name: "Mohale's Hoek", lat: -30.1483, lng: 27.4794 }
]

export default function ReportCrime() {
  const navigate = useNavigate()
  const { toast, render } = useToasts()
  const { user, isOfficer } = useAuth()
  const signedCitizen = !!user && !isOfficer
  const [location, setLocation] = useState({ lat: CITIES[0].lat, lng: CITIES[0].lng })
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [stationsList, setStationsList] = useState([])
  const [selectedStationId, setSelectedStationId] = useState('')
  const [locating, setLocating] = useState(false)
  const [locationSource, setLocationSource] = useState('default')

  const address = useMemo(() => nearStreet(location.lat, location.lng), [location])

  const allStations = stationsList.length ? stationsList : fallbackStations

  const nearby = useMemo(
    () => stationsByDistance(location.lat, location.lng, allStations, 6),
    [location, allStations]
  )

  const allByDistance = useMemo(
    () => stationsByDistance(location.lat, location.lng, allStations),
    [location, allStations]
  )

  const selectedStation = useMemo(
    () => allByDistance.find((s) => s.id === selectedStationId) || nearby[0] || null,
    [allByDistance, nearby, selectedStationId]
  )

  useEffect(() => {
    let mounted = true
    getStations().then((list) => {
      if (mounted && Array.isArray(list) && list.length) setStationsList(list)
    })
    return () => {
      mounted = false
    }
  }, [])

  // When the incident location changes, re-route to the closest station.
  useEffect(() => {
    if (nearby.length) setSelectedStationId(nearby[0].id)
  }, [nearby])

  // Try to detect the citizen's location automatically on page load.
  useEffect(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: +pos.coords.latitude.toFixed(6),
          lng: +pos.coords.longitude.toFixed(6)
        })
        setLocationSource('gps')
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) })
        setLocationSource('gps')
        setLocating(false)
      },
      () => {
        setLocating(false)
        toast.error('Could not access your location')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!category) return toast.error('Please choose a crime category')
    if (description.trim().length < 10) return toast.error('Please describe the incident (min 10 characters)')
    if (!selectedStation) return toast.error('Please choose a nearby police station')

    setSubmitting(true)
    const formData = new FormData()
    formData.append('category', category)
    formData.append('description', description)
    formData.append('lat', location.lat)
    formData.append('lng', location.lng)
    formData.append('address', address)
    formData.append('anonymous', String(anonymous))
    formData.append('stationId', selectedStation.id)
    files.forEach((f) => formData.append('media', f.file, f.name))

    try {
      const res = await submitReport(formData)
      setResult(res)
      toast.success('Report submitted successfully')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page container">
      <div className="section-head" style={{ marginTop: 28 }}>
        <div>
          <h2>Report an Incident</h2>
          <p>Pin the exact location, describe what happened and attach evidence. Anonymous by default.</p>
        </div>
        <Link to="/track" className="btn btn-ghost">
          Already reported? Track it
        </Link>
      </div>

      <div className="report-grid">
        {/* Left: map picker */}
        <div className="card panel-pad">
          <div className="picker-head">
            <div className="card-title">Pin the location</div>
            <div className="coord-chip">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </div>
          </div>
          <div className="map-canvas">
            <MapPicker
              value={location}
              onChange={(loc) => {
                setLocation({ ...loc })
                setLocationSource('picked')
              }}
              height="clamp(300px, 52vh, 430px)"
            />
          </div>
          <div className="address-preview">
            <MapPinIcon size={16} />
            <span>{address}</span>
          </div>

          <div className="station-picker">
            <div className="station-picker-head">
              <div>
                <div className="card-title">Nearest police station</div>
                <div className="card-sub">
                  {locating
                    ? 'Detecting your location…'
                    : locationSource === 'gps'
                      ? 'Based on your GPS location'
                      : locationSource === 'picked'
                        ? 'Based on the pinned location'
                        : 'Pick your location to find the closest station'}
                </div>
              </div>
              <button type="button" className="btn btn-outline-blue" onClick={useMyLocation} disabled={locating}>
                <CrosshairIcon size={16} /> {locating ? 'Locating…' : 'Use my location'}
              </button>
            </div>

            <div className="station-list">
              {nearby.slice(0, 5).map((s) => {
                const active = selectedStation?.id === s.id
                return (
                  <button
                    type="button"
                    key={s.id}
                    className={`station-option ${active ? 'active' : ''}`}
                    onClick={() => setSelectedStationId(s.id)}
                  >
                    <span className="station-option-icon">
                      <ShieldIcon size={15} />
                    </span>
                    <span className="station-name">{s.name}</span>
                    <span className="station-distance">{formatKm(s.distanceKm)}</span>
                    {active && <CheckIcon size={14} style={{ color: 'var(--green-bright)' }} />}
                  </button>
                )
              })}
            </div>

            <div className="field" style={{ marginTop: 12 }}>
              <label className="label">Or choose another station</label>
              <select
                className="select"
                value={selectedStation?.id || ''}
                onChange={(e) => setSelectedStationId(e.target.value)}
              >
                <option value="">Select a station…</option>
                {allByDistance.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {formatKm(s.distanceKm)} away
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {CITIES.map((c) => (
              <button
                key={c.name}
                className="btn btn-ghost"
                onClick={() => {
                  setLocation({ lat: c.lat, lng: c.lng })
                  setLocationSource('picked')
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div className="card panel-pad">
          <form className="report-form" onSubmit={handleSubmit}>
            <div className="report-form-head">
              <h2>Incident details</h2>
              <span className="meter">Anonymous mode {anonymous ? 'ON' : 'OFF'}</span>
            </div>

            <div className="field">
              <label className="label">Crime Type</label>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label">Description</label>
              <textarea
                className="textarea"
                rows={5}
                maxLength={1200}
                placeholder="Describe what happened, when, and any details officers should know…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 11.5, color: 'var(--faint)' }}>
                {description.length} / 1200
              </div>
            </div>

            <div>
              <label className="label" style={{ marginBottom: 9, display: 'block' }}>
                Evidence (photos / videos)
              </label>
              <MediaUploader files={files} onChange={setFiles} />
            </div>

            {selectedStation && (
              <div className="station-summary">
                <ShieldIcon size={17} />
                <span>
                  Reporting to <b>{selectedStation.name}</b> · {formatKm(selectedStation.distanceKm)} away
                </span>
              </div>
            )}

            <label className="checkbox-row">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              Submit anonymously — my identity will not be shown to the public
            </label>

            <button type="submit" className="btn btn-green btn-lg" disabled={submitting}>
              {submitting ? 'Submitting…' : (
                <>
                  <SirenIcon size={18} /> Submit Incident Report
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Success modal */}
      {result && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="big-check">
              <CheckIcon size={32} />
            </div>
            <h3>Report received</h3>
            <p>Track your report anytime with your anonymous token.</p>
            <div className="token-card">{result.token}</div>
            {result.station && (
              <div className="station-summary" style={{ marginTop: 14 }}>
                <ShieldIcon size={17} />
                <span>
                  Routed to <b>{result.station.name}</b> · {formatKm(result.station.distanceKm)} away
                </span>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-blue btn-block" onClick={() => navigate(`/track?token=${result.token}`)}>
                Track status now
              </button>
              {signedCitizen ? (
                <button
                  className="btn btn-outline-blue btn-block"
                  onClick={() => navigate('/', { state: { focusMy: true } })}
                >
                  View My Reports
                </button>
              ) : null}
              <button className="btn btn-ghost btn-block" onClick={() => setResult(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {render()}
    </div>
  )
}