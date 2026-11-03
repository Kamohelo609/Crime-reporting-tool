/** Street pairs used to build a human-readable address near a pin. */
const STREETS = [
  ['Kingsway', 'Pioneer'],
  ['Moshoeshoe', 'Constitution'],
  ['Main North', 'Airport'],
  ['Kofi Annan', 'Lindi'],
  ['St. Germain', 'Naledi'],
  ['Highlands', 'Motsoene'],
  ['Old Parade', 'Aupolo'],
  ['Educorp', 'Life College']
]

/** Same deterministic hash the client uses, so addresses match. */
function nearStreet(lat, lng) {
  const h = Math.abs(Math.round(Number(lat) * 1000)) ^ Math.abs(Math.round(Number(lng) * 1000))
  const [a, b] = STREETS[((h % STREETS.length) + STREETS.length) % STREETS.length]
  return `${a} & ${b} Road`
}

/** Great-circle distance in kilometres. */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** Nearest station from a list of {lat, lng, ...}. Returns { station, km }. */
function nearestStation(lat, lng, stations) {
  let best = null
  let bestKm = Infinity
  for (const s of stations || []) {
    const km = haversineKm(lat, lng, Number(s.lat), Number(s.lng))
    if (km < bestKm) {
      bestKm = km
      best = s
    }
  }
  return best ? { station: best, km: bestKm } : null
}

/** Stations sorted closest-first with a `distanceKm` property. */
function stationsByDistance(lat, lng, stations, limit = Infinity) {
  return (stations || [])
    .map((s) => ({
      ...s,
      distanceKm: haversineKm(lat, lng, Number(s.lat), Number(s.lng))
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
}

/** '5 mins ago' / '3 hrs ago' / '2 days ago' — matches the client's fmtTime. */
function relativeTime(date) {
  const then = new Date(date).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} mins ago`
  if (mins < 1440) return `${Math.round(mins / 60)} hrs ago`
  return `${Math.round(mins / 1440)} days ago`
}

module.exports = { nearStreet, haversineKm, nearestStation, stationsByDistance, relativeTime }
