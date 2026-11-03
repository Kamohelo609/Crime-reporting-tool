import { useEffect, useRef } from 'react'
import L from 'leaflet'

const pickIcon = L.divIcon({
  className: '',
  html: '<div class="pick-marker"></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 24],
  popupAnchor: [0, -22]
})

export default function MapPicker({ value, onChange, height = 430, center = [-29.3142, 27.4833], zoom = 13 }) {
  const el = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const mapHeight = typeof height === 'number' ? `${height}px` : height

  useEffect(() => {
    if (!el.current) return
    const map = L.map(el.current, { zoomControl: true }).setView(center, zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)

    const marker = L.marker([center[0], center[1]], { icon: pickIcon, draggable: true }).addTo(map)

    const emit = (latlng) => onChange({ lat: +latlng.lat.toFixed(6), lng: +latlng.lng.toFixed(6) })

    marker.on('dragend', () => emit(marker.getLatLng()))
    map.on('click', (e) => {
      marker.setLatLng(e.latlng)
      emit(e.latlng)
    })

    mapRef.current = map
    markerRef.current = marker
    emit(L.latLng(center[0], center[1]))

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (value && markerRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng])
      mapRef.current?.setView([value.lat, value.lng], mapRef.current.getZoom(), { animate: true })
    }
  }, [value?.lat, value?.lng])

  return <div ref={el} style={{ height: mapHeight, width: '100%', zIndex: 1, borderRadius: '14px' }} />
}