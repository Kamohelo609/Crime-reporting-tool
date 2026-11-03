import { useEffect, useRef } from 'react'
import L from 'leaflet'

const colorFor = (status) => {
  const s = (status || '').toLowerCase()
  if (s.includes('progress') || s.includes('assigned')) return 'amber'
  if (s.includes('resolved')) return 'green'
  return 'red'
}

function pinIcon(status, size = 26) {
  return L.divIcon({
    className: '',
    html: `<div class="disc-pin ${colorFor(status)}" style="width:${size}px;height:${size}px">!</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  })
}

const meIcon = L.divIcon({
  className: '',
  html: '<div class="me-marker"><span class="me-pulse"></span><span class="me-dot"></span></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
})

export default function MapWidget({
  pins = [],
  height = 380,
  center = [-29.3142, 27.4833],
  zoom = 12,
  userLocation = null
}) {
  const el = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const meRef = useRef(null)
  const fittedOnce = useRef(false)
  const mapHeight = typeof height === 'number' ? `${height}px` : height

  useEffect(() => {
    if (!el.current) return
    const map = L.map(el.current, { zoomControl: true }).setView(center, zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      meRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!userLocation) {
      if (meRef.current) {
        map.removeLayer(meRef.current)
        meRef.current = null
      }
      return
    }
    const latlng = [userLocation.lat, userLocation.lng]
    if (!meRef.current) {
      meRef.current = L.marker(latlng, { icon: meIcon, zIndexOffset: 1000 })
        .bindTooltip('You are here', {
          permanent: true,
          direction: 'top',
          className: 'me-tooltip',
          offset: [0, -12]
        })
        .addTo(map)
    } else {
      meRef.current.setLatLng(latlng)
    }
    map.setView(latlng, Math.max(map.getZoom(), 13), { animate: true })
  }, [userLocation?.lat, userLocation?.lng])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (layerRef.current) {
      layerRef.current.clearLayers()
      map.removeLayer(layerRef.current)
    }
    const layer = L.layerGroup()
    pins.forEach((p) => {
      const mk = L.marker([p.lat, p.lng], {
        icon: pinIcon(p.status, p.size || 26),
        title: p.title || p.category
      })
      const content = `
        <b style="color:#201c13">${p.title || p.category}</b><br/>
        <span style="color:#756b57;font-size:12px">${[p.label, p.time, p.status].filter(Boolean).join(' · ')}</span>
      `
      mk.bindPopup(content, { closeButton: false })
      layer.addLayer(mk)
    })
    layer.addTo(map)
    layerRef.current = layer
    if (!fittedOnce.current && pins.length) {
      fittedOnce.current = true
      const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng]))
      map.fitBounds(bounds.pad(0.25))
    }
  }, [pins])

  return <div ref={el} style={{ height: mapHeight, width: '100%', zIndex: 1, borderRadius: '14px' }} />
}