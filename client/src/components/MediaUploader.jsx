import { useCallback, useRef, useState } from 'react'
import CameraCapture from './CameraCapture.jsx'
import { CameraIcon, VideoIcon, UploadIcon, TrashIcon } from './Icons.jsx'

function filePreview(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve({ url: e.target.result })
    reader.readAsDataURL(file)
  })
}

export default function MediaUploader({ files, onChange }) {
  const [dragover, setDragover] = useState(false)
  const [showCam, setShowCam] = useState(false)
  const inputRef = useRef(null)

  const addFiles = useCallback(
    async (list) => {
      const incoming = Array.from(list).filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))
      if (!incoming.length) return
      const enriched = await Promise.all(
        incoming.map(async (f) => ({ file: f, type: f.type.startsWith('video/') ? 'video' : 'image', name: f.name, ...(await filePreview(f)) }))
      )
      onChange([...files, ...enriched])
    },
    [files, onChange]
  )

  const remove = (i) => onChange(files.filter((_, idx) => idx !== i))

  return (
    <div>
      <div
        className={`dropzone${dragover ? ' dragover' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragover(true)
        }}
        onDragLeave={() => setDragover(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragover(false)
          addFiles(e.dataTransfer.files)
        }}
      >
        <UploadIcon size={28} style={{ margin: '0 auto 8px' }} />
        <b>Drag &amp; drop evidence</b>
        <p>or click to browse photos and videos</p>
        <small>JPG · PNG · MP4 · WEBM · max 25MB per file</small>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      <div className="capture-row">
        <button type="button" className="btn btn-primary" onClick={() => setShowCam(true)}>
          <CameraIcon size={16} /> Take Photo
        </button>
        <button type="button" className="btn btn-blue" onClick={() => setShowCam(true)}>
          <VideoIcon size={16} /> Record Video
        </button>
      </div>

      {showCam && (
        <CameraCapture
          onClose={() => setShowCam(false)}
          onCapture={(list) => {
            addFiles(list)
            setShowCam(false)
          }}
        />
      )}

      {files.length > 0 && (
        <div className="media-grid">
          {files.map((f, i) => (
            <div className="media-thumb" key={i}>
              {f.type === 'video' ? (
                <video src={f.url} muted preload="metadata" />
              ) : (
                <img src={f.url} alt={f.name} />
              )}
              <span className="media-badge">{f.type === 'video' ? 'VIDEO' : 'PHOTO'}</span>
              <button className="media-remove" onClick={() => remove(i)} title="Remove">
                ×
              </button>
              <div className="media-name">{f.name}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11.5, color: 'var(--faint)', alignItems: 'center' }}>
        <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
          <CameraIcon size={13} /> {files.filter((f) => f.type === 'image').length} photo(s)
        </span>
        <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
          <VideoIcon size={13} /> {files.filter((f) => f.type === 'video').length} video(s)
        </span>
        {files.length > 0 && (
          <span
            style={{ marginLeft: 'auto', color: 'var(--red-bright)', cursor: 'pointer', display: 'inline-flex', gap: 5, alignItems: 'center' }}
            onClick={() => onChange([])}
          >
            <TrashIcon size={13} /> Clear all
          </span>
        )}
      </div>
    </div>
  )
}