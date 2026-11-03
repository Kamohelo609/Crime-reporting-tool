import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import StatusTimeline from '../components/StatusTimeline.jsx'
import { trackReport } from '../services/api.js'
import { useToasts } from '../components/Toasts.jsx'
import { SearchIcon, MapPinIcon, ClockIcon, FileIcon, AlertIcon, ShieldIcon } from '../components/Icons.jsx'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function TrackStatus() {
  const [params] = useSearchParams()
  const [token, setToken] = useState(params.get('token') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState('')
  const { toast, render } = useToasts()

  const search = async (value) => {
    const t = (value || token).trim()
    if (!t) return toast.error('Please enter a tracking token')
    setToken(t)
    setLoading(true)
    setError('')
    try {
      const res = await trackReport(t)
      if (res && res.token) {
        setResult(res)
        setHasSearched(true)
      } else {
        setError('No report found for this token')
        setResult(null)
      }
    } catch {
      setError('Unable to reach tracking service')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = params.get('token')
    if (t) search(t)
  }, [params])

  return (
    <div className="page container">
      <div className="track-hero">
        <h1>Track Your Report</h1>
        <p>Enter the anonymous token you received after submitting an incident.</p>

        <form
          className="track-box"
          onSubmit={(e) => {
            e.preventDefault()
            search()
          }}
        >
          <SearchIcon size={18} style={{ margin: '0 0 0 18px', color: 'var(--faint)', alignSelf: 'center' }} />
          <input
            className="track-input"
            placeholder="Enter tracking token · e.g. REP-8921-X"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button className="track-search-btn" type="submit" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
      </div>

      {error && (
        <div className="card" style={{ padding: 22, maxWidth: 520, margin: '26px auto 0', textAlign: 'center' }}>
          <AlertIcon size={28} style={{ color: 'var(--red-bright)', margin: '0 auto 10px' }} />
          <p style={{ color: 'var(--text-soft)', fontWeight: 600 }}>{error}</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
            Double-check your token — it looks like REP-####-X.
          </p>
        </div>
      )}

      {result && hasSearched && (
        <div className="results-area">
          <div className="card panel-pad">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldIcon size={18} style={{ color: 'var(--blue-bright)' }} />
              Report progress — <span className="mono" style={{ color: 'var(--green-bright)' }}>{result.token}</span>
            </div>
            <StatusTimeline status={result.status} />
          </div>

          <div className="result-summary">
            <div className="card panel-pad">
              <div className="card-title" style={{ marginBottom: 6 }}>
                Incident summary
              </div>
              <div className="summary-card">
                <div className="row">
                  <span>Reference</span>
                  <b className="mono">{result.id}</b>
                </div>
                <div className="row">
                  <span>Category</span>
                  <b>{result.category}</b>
                </div>
                <div className="row">
                  <span>Status</span>
                  <b style={{ color: result.status === 'Resolved' ? 'var(--green-bright)' : 'var(--amber-bright)' }}>
                    {result.status}
                  </b>
                </div>
                <div className="row">
                  <span>Location</span>
                  <b>{result.address}</b>
                </div>
                {result.station && (
                  <div className="row">
                    <span>Station</span>
                    <b>{result.station.name}</b>
                  </div>
                )}
                <div className="row">
                  <span>Submitted</span>
                  <b>{formatDate(result.receivedAt)}</b>
                </div>
                <div className="row">
                  <span>Reporter</span>
                  <b>{result.reporterType || 'Anonymous'}</b>
                </div>
              </div>

              {result.latestUpdate && (
                <div className="latest-update">
                  <ShieldIcon size={16} style={{ color: 'var(--blue-bright)', flexShrink: 0, marginTop: 2 }} />
                  <span>
                    <b>Latest Update:</b> {result.latestUpdate}
                  </span>
                </div>
              )}
            </div>

            <div className="card panel-pad" style={{ alignSelf: 'start' }}>
              <div className="card-title" style={{ marginBottom: 14 }}>
                Case details
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div style={{ display: 'flex', gap: 9, color: 'var(--muted)', alignItems: 'flex-start' }}>
                  <MapPinIcon size={15} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 13 }}>
                    <b style={{ color: 'var(--text-soft)' }}>{result.address}</b>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 9, color: 'var(--muted)', alignItems: 'flex-start' }}>
                  <ClockIcon size={15} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 13 }}>Received {formatDate(result.receivedAt)}</span>
                </div>
                <div style={{ display: 'flex', gap: 9, color: 'var(--muted)', alignItems: 'flex-start' }}>
                  <FileIcon size={15} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 13 }}>Anonymous evidence preserved for law enforcement</span>
                </div>
              </div>
              <div className="address-preview" style={{ marginTop: 16 }}>
                <ShieldIcon size={16} /> Your token stays secret. Share it only with your precinct.
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasSearched && !error && (
        <div className="home-split" style={{ marginTop: 30 }}>
          <div className="card panel-pad" style={{ textAlign: 'center' }}>
            <ShieldIcon size={40} style={{ color: 'var(--green-bright)', margin: '0 auto 12px' }} />
            <b style={{ fontSize: 17 }}>Fast &amp; anonymous</b>
            <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 6 }}>
              Your identity is never linked to the token, so you can check status safely at any time.
            </p>
          </div>
          <div className="card panel-pad" style={{ textAlign: 'center' }}>
            <ClockIcon size={40} style={{ color: 'var(--blue-bright)', margin: '0 auto 12px' }} />
            <b style={{ fontSize: 17 }}>Every step visible</b>
            <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 6 }}>
              From report received to resolution — watch your case move through the dispatch pipeline live.
            </p>
          </div>
        </div>
      )}

      {render()}
    </div>
  )
}