import { useEffect, useRef, useState } from 'react'
import { CameraIcon, VideoIcon, CloseIcon, SirenIcon } from './Icons.jsx'

export default function CameraCapture({ onClose, onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const [error, setError] = useState('')
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    let mounted = true
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera capture is not supported by this browser.')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false })
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const v = videoRef.current
        if (v) {
          v.srcObject = stream
          v.play().catch(() => {})
        }
      })
      .catch(() => setError('Camera is unavailable. Allow camera access, or attach files instead.'))

    return () => {
      mounted = false
      if (timerRef.current) clearInterval(timerRef.current)
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const stopElapsedTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  const takePhoto = () => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    canvas.getContext('2d').drawImage(v, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const name = `IMG_${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}.png`
        onCapture([new File([blob], name, { type: 'image/png' })])
      },
      'image/png'
    )
  }

  const toggleRecord = () => {
    if (recording) {
      recorderRef.current?.stop()
      stopElapsedTimer()
      setRecording(false)
      return
    }

    if (typeof MediaRecorder === 'undefined') {
      setError('Video recording is not supported by this browser.')
      return
    }
    const stream = streamRef.current
    if (!stream) return

    try {
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm' })
      chunksRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const name = `VID_${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}.webm`
        onCapture([new File([blob], name, { type: 'video/webm' })])
        stopElapsedTimer()
        setRecording(false)
      }
      rec.start()
      recorderRef.current = rec
      setRecording(true)
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } catch {
      setError('Unable to start video recording.')
    }
  }

  const pad = (n) => String(n).padStart(2, '0')
  const stamp = `${pad(Math.floor(elapsed / 60))}:${pad(elapsed % 60)}`

  return (
    <div className="modal-overlay">
      <div className="modal cam-modal">
        <div className="cam-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SirenIcon size={16} style={{ color: 'var(--red-bright)' }} />
            <b>Live camera</b>
          </div>
          <button className="cam-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="cam-frame">
          <video ref={videoRef} muted playsInline autoPlay />
          {error && (
            <div className="cam-error">
              <p>{error}</p>
              <button className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          )}
          {recording && (
            <span className="rec-badge">
              <span className="rec-dot" /> REC {stamp}
            </span>
          )}
        </div>

        <div className="cam-actions">
          <button className="btn btn-primary" onClick={takePhoto} disabled={!!error}>
            <CameraIcon size={16} /> Take Photo
          </button>
          <button className="btn btn-blue" onClick={toggleRecord} disabled={!!error}>
            {recording ? (
              <>
                <span className="rec-dot" style={{ width: 10, height: 10, borderRadius: 2, background: '#fff' }} /> Stop
              </>
            ) : (
              <>
                <VideoIcon size={16} /> Record Video
              </>
            )}
          </button>
        </div>
        <p className="cam-note">
          {recording ? 'Recording… tap Stop when finished. The clip is attached to your report.' : 'Photos are captured instantly. Video clips are recorded on-device and attached to your report.'}
        </p>
      </div>
    </div>
  )
}