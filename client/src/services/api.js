import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms))

const CATEGORIES = ['Vandalism', 'Theft', 'Assault', 'Burglary', 'Harassment', 'Fraud', 'Other']

const STATUS_FLOW = ['Received', 'Assigned', 'Under Investigation', 'Resolved']

const MASERU = { lat: -29.3142, lng: 27.4833 }

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

function nearStreet(lat, lng) {
  const h = Math.abs(Math.round(lat * 1000)) ^ Math.abs(Math.round(lng * 1000))
  const [a, b] = STREETS[((h % STREETS.length) + STREETS.length) % STREETS.length]
  return `${a} & ${b} Road`
}

function fmtTime(minAgo) {
  if (minAgo < 60) return `${minAgo} mins ago`
  if (minAgo < 1440) return `${Math.round(minAgo / 60)} hrs ago`
  return `${Math.round(minAgo / 1440)} days ago`
}

let mockSeq = 40

function makeToken() {
  const n = Math.floor(1000 + Math.random() * 9000)
  mockSeq += 1
  return `REP-${mockSeq}-${String.fromCharCode(65 + (mockSeq % 26))}`
}

function makeTimestamp(minAgo) {
  return new Date(Date.now() - minAgo * 60 * 1000)
}

function pin(lat, lng) {
  return { lat: +lat.toFixed(6), lng: +lng.toFixed(6) }
}

export const mockReports = [
  {
    ...{ id: 'INC-1021', token: 'REP-8921-X', category: 'Theft' },
    ...pin(-29.3105, 27.4879),
    description: 'Two suspects seen breaking into a parked vehicle outside the mall entrance by Kingsway Road. Suspects fled on foot towards the bus ranks.',
    reporterType: 'Anonymous',
    status: 'Under Investigation',
    media: [{ type: 'image', name: 'IMG_2311.PNG', url: null }],
    receivedAt: makeTimestamp(8),
    latestUpdate: 'Patrol unit 4 dispatched to the scene'
  },
  {
    ...{ id: 'INC-1022', token: 'REP-4471-A', category: 'Vandalism' },
    ...pin(-29.3041, 27.4752),
    description: 'Graffiti sprayed on the side wall of the community library near Pitso Ground. Suspects wearing dark hoodies seen around 6:40 AM.',
    reporterType: 'Registered',
    status: 'Assigned',
    media: [{ type: 'image', name: 'IMG_2290.PNG', url: null }],
    receivedAt: makeTimestamp(5),
    latestUpdate: 'Case assigned to Detective K. Mokoena'
  },
  {
    ...{ id: 'INC-1023', token: 'REP-9983-B', category: 'Theft' },
    ...pin(-29.322, 27.4712),
    description: 'Snatch and run incident near Manthabiseng Convention Centre; victim reports phone and wallet taken.',
    reporterType: 'Anonymous',
    status: 'Pending',
    media: [{ type: 'video', name: 'VID_005.MP4', url: null }],
    receivedAt: makeTimestamp(2),
    latestUpdate: 'Awaiting unit assignment'
  },
  {
    ...{ id: 'INC-1024', token: 'REP-1120-C', category: 'Assault' },
    ...pin(-29.3185, 27.5031),
    description: 'Physical altercation outside a tavern along the Main South Road, one person injured, security intervened.',
    reporterType: 'Registered',
    status: 'In Progress',
    media: [{ type: 'video', name: 'VID_018.MP4', url: null }, { type: 'image', name: 'IMG_2300.PNG', url: null }],
    receivedAt: makeTimestamp(3),
    latestUpdate: 'Patrol unit 2 en route, ETA 4 minutes'
  },
  {
    ...{ id: 'INC-1025', token: 'REP-3340-D', category: 'Burglary' },
    ...pin(-29.2994, 27.4567),
    description: 'Break-in at a corner store near the Pioneer Road turnoff overnight; cash register emptied.',
    reporterType: 'Anonymous',
    status: 'Resolved',
    media: [{ type: 'image', name: 'IMG_2277.PNG', url: null }],
    receivedAt: makeTimestamp(95),
    latestUpdate: 'Case resolved, suspect arrested'
  },
  {
    ...{ id: 'INC-1026', token: 'REP-7654-E', category: 'Vandalism' },
    ...pin(-29.3302, 27.4939),
    description: 'Streetlight smashed near the taxi rank on the outskirts of the CBD; glass scattered on the sidewalk.',
    reporterType: 'Anonymous',
    status: 'Pending',
    media: [{ type: 'image', name: 'IMG_2320.PNG', url: null }],
    receivedAt: makeTimestamp(1),
    latestUpdate: 'Report received'
  }
].map((r) => ({ ...r, address: nearStreet(r.lat, r.lng) }))

export const publicIncidents = [
  { ...pin(-29.3105, 27.4879), id: 'P-01', title: 'Vandalism', category: 'Vandalism', time: '5 mins ago', status: 'Under Investigation' },
  { ...pin(-29.3041, 27.4752), id: 'P-02', title: 'Theft reported', category: 'Theft', time: '8 mins ago', status: 'Assigned' },
  { ...pin(-29.322, 27.4712), id: 'P-03', title: 'Suspicious activity', category: 'Other', time: '14 mins ago', status: 'Pending' },
  { ...pin(-29.3185, 27.5031), id: 'P-04', title: 'Assault', category: 'Assault', time: '21 mins ago', status: 'In Progress' },
  { ...pin(-29.2994, 27.4567), id: 'P-05', title: 'Burglary', category: 'Burglary', time: '48 mins ago', status: 'Resolved' }
]

export const stations = [
  ['ST-01', 'Maseru Central Police Station', -29.3142, 27.4833],
  ['ST-02', 'Maseru Police Headquarters', -29.312, 27.477],
  ['ST-03', 'Police Training College Police Station', -29.32988, 27.48251],
  ['ST-04', 'Maseru Mall Police Station', -29.33487, 27.48517],
  ['ST-05', 'Hoohlo Police Station', -29.2961, 27.47565],
  ['ST-06', 'Thamae Police Station', -29.32856, 27.51612],
  ['ST-07', 'Lithoteng Police Station', -29.36333, 27.51137],
  ['ST-08', 'Mabote Police Station', -29.29438, 27.53316],
  ['ST-09', 'Maseru Rural (Mazenod) Police Station', -29.41618, 27.55922],
  ['ST-10', 'Roma Police Post', -29.45581, 27.72299],
  ['ST-11', 'Morija Police Station', -29.62758, 27.50191],
  ['ST-12', 'Thaba Bosiu Police Post', -29.34408, 27.6696],
  ['ST-13', 'Semonkong Police Post', -29.84597, 28.05114],
  ['ST-14', 'Nyakosoba Police Post', -29.52445, 27.77342],
  ['ST-15', 'Marakabei Police Post', -29.54236, 28.13779],
  ['ST-16', 'Berea Police Station (Teyateyaneng)', -29.14602, 27.74063],
  ['ST-17', 'Mapoteng Police Post', -29.11512, 27.97274],
  ['ST-18', 'Peka Police Station', -28.97194, 27.76403],
  ['ST-19', 'Ha Foso Police Post', -29.26959, 27.57404],
  ['ST-20', 'Hlotse Police Station', -28.87082, 28.04189],
  ['ST-21', 'Maputsoe Border Post Police Station', -28.88586, 27.89243],
  ['ST-22', 'Pitseng Police Station', -29.0012, 28.2114],
  ['ST-23', 'Thaba Phatsoa Police Station', -28.98823, 28.13978],
  ['ST-24', 'Butha-Buthe Police Station', -28.76299, 28.24646],
  ['ST-25', 'Qholaqhoe Police Station', -28.64313, 28.44948],
  ['ST-26', 'Qalo Police Station', -28.69769, 28.3413],
  ['ST-27', 'Joels Drift Police Post', -28.69, 28.31],
  ['ST-28', "Ts'akholo Police Post", -28.7624, 28.6726],
  ['ST-29', 'Mafeteng Police Station', -29.82303, 27.24134],
  ['ST-30', 'Matelile Police Station', -29.81678, 27.51246],
  ['ST-31', "Mohale's Hoek Police Station", -30.15156, 27.47626],
  ['ST-32', 'Mpharane Police Station', -30.00031, 27.57728],
  ['ST-33', 'Liphiring Police Station', -30.12699, 27.3251],
  ['ST-34', 'Quthing (Moyeni) Police Station', -30.40162, 27.70567],
  ['ST-35', 'Mount Moorosi Police Post', -30.27432, 27.87313],
  ['ST-36', 'Mphaki Police Station', -30.19044, 28.12839],
  ['ST-37', 'Tele Police Post', -30.61519, 27.88802],
  ['ST-38', 'Dilli-Dilli Police Station', -30.52651, 27.66877],
  ['ST-39', "Qacha's Nek Police Station", -30.11333, 28.6811],
  ['ST-40', 'Sekake Police Station', -30.04881, 28.3633],
  ['ST-41', 'Mokhotlong Police Station', -29.28942, 29.06317],
  ['ST-42', 'Mapholaneng Police Station', -29.20045, 28.86291],
  ['ST-43', 'Sehonghong Police Post', -29.49891, 29.29913],
  ['ST-44', 'Thaba-Tseka Police Station', -29.51518, 28.60362],
  ['ST-45', 'Mantsonyane Police Post', -29.53391, 28.26782],
  ['ST-46', 'Sani Top Border Police Station', -29.58471, 29.28544]
].map(([id, name, lat, lng]) => ({ id, name, lat, lng, units: ['Unit 1', 'Unit 2'] }))

/** Great-circle distance in kilometres. */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** Stations sorted closest-first, each with a `distanceKm` property. */
export function stationsByDistance(lat, lng, list = stations, limit = Infinity) {
  return list
    .map((s) => ({ ...s, distanceKm: haversineKm(lat, lng, Number(s.lat), Number(s.lng)) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
}

export function formatKm(km) {
  if (!Number.isFinite(km)) return ''
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(km < 10 ? 1 : 0)} km`
}

export async function registerUser(payload) {
  await delay()
  try {
    const { data } = await api.post('/auth/register', payload)
    return data
  } catch (err) {
    // Server answered (validation error / duplicate email) — surface it
    if (err?.response) throw err
    // Server unreachable — offline demo fallback
    return {
      user: { id: 'C-' + Date.now(), fullName: payload.fullName, phone: payload.phone, email: payload.email, role: 'citizen' },
      token: 'demo-token-' + Date.now()
    }
  }
}

export async function loginUser(payload) {
  await delay()
  try {
    const { data } = await api.post('/auth/login', payload)
    return data
  } catch (err) {
    // Server answered (wrong password / role mismatch) — surface it
    if (err?.response) throw err
    // Server unreachable — offline demo fallback
    const role = payload.role || 'citizen'
    if (role === 'officer') {
      const digits = String(payload.email || '').replace(/\D/g, '')
      const badge = digits ? `#${digits.padStart(4, '0').slice(-4)}` : '#4021'
      return {
        user: { id: 'O-' + badge.slice(1), fullName: 'J. Doe', badge, email: 'j.doe@precinct12.gov', role: 'officer' },
        token: 'demo-officer-token-' + Date.now()
      }
    }
    return {
      user: { id: 'C-' + Date.now(), fullName: (payload.email || 'citizen').split('@')[0], email: payload.email, role: 'citizen' },
      token: 'demo-token-' + Date.now()
    }
  }
}

export async function submitReport(formData) {
  await delay()
  const token = makeToken()
  const lat = Number(formData.get('lat'))
  const lng = Number(formData.get('lng'))
  let report
  try {
    const { data } = await api.post('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    report = data
  } catch (err) {
    // Server answered (validation / upload error) — surface it
    if (err?.response) throw err
    // Server unreachable — offline demo fallback
    const chosenId = String(formData.get('stationId') || '').toUpperCase()
    const nearest =
      stations.find((s) => s.id.toUpperCase() === chosenId) ||
      stationsByDistance(lat || MASERU.lat, lng || MASERU.lng, stations, 1)[0] ||
      null
    report = {
      id: 'INC-' + (1000 + mockSeq),
      token,
      category: formData.get('category') || 'Other',
      description: formData.get('description') || '',
      status: 'Pending',
      address: nearStreet(lat || MASERU.lat, lng || MASERU.lng),
      reporterType: formData.get('anonymous') === 'true' ? 'Anonymous' : 'Registered',
      submittedAt: new Date().toISOString(),
      station: nearest
        ? {
            id: nearest.id,
            name: nearest.name,
            lat: nearest.lat,
            lng: nearest.lng,
            distanceKm: haversineKm(lat || MASERU.lat, lng || MASERU.lng, nearest.lat, nearest.lng)
          }
        : null
    }
  }
  addMyReport(report)
  return report
}

const MY_KEY = 'sc_my_reports'

function readMy() {
  try {
    return JSON.parse(localStorage.getItem(MY_KEY)) || []
  } catch {
    return []
  }
}

function writeMy(list) {
  localStorage.setItem(MY_KEY, JSON.stringify(list.slice(0, 50)))
}

export function addMyReport(report) {
  const list = readMy()
  const idx = list.findIndex((r) => r.token === report.token)
  if (idx >= 0) list[idx] = { ...list[idx], ...report }
  else list.unshift(report)
  writeMy(list)
  return list
}

export function getMyReports() {
  return readMy()
}

export async function trackReport(token) {
  await delay(900)
  try {
    const { data } = await api.get(`/reports/track/${token}`)
    return data
  } catch (err) {
    // Server answered "no such token" — return null so the page shows a real 404
    if (err?.response?.status === 404) return null
    const match = mockReports.find((r) => r.token.toLowerCase() === token.trim().toLowerCase())
    if (match) return { ...match }
    const h = token.trim().split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const generic = {
      id: 'INC-' + (1000 + (h % 900)),
      token: token.trim().toUpperCase(),
      category: CATEGORIES[h % CATEGORIES.length],
      description: 'Incident details are masked for anonymous reports.',
      status: STATUS_FLOW[h % (STATUS_FLOW.length - 1)],
      latestUpdate: 'Report verified. No further public details available.',
      receivedAt: makeTimestamp((h % 60) + 1),
      address: nearStreet(MASERU.lat + ((h % 100) / 10000), MASERU.lng + ((h % 77) / 10000)),
      reporterType: 'Anonymous'
    }
    return generic
  }
}

export async function getPublicIncidents() {
  try {
    const { data } = await api.get('/reports/public')
    return data
  } catch {
    return publicIncidents
  }
}

export async function getDispatchFeed() {
  try {
    const { data } = await api.get('/reports')
    return data
  } catch {
    return mockReports
  }
}

export async function getStations() {
  try {
    const { data } = await api.get('/stations')
    return data
  } catch {
    return stations
  }
}

/** Closest stations to a coordinate, sorted nearest-first. */
export async function getNearbyStations(lat, lng, limit = 5) {
  try {
    const { data } = await api.get('/stations/nearest', { params: { lat, lng, limit } })
    return data
  } catch {
    return stationsByDistance(lat, lng, stations, limit)
  }
}

export async function dispatchUnit(payload) {
  await delay(500)
  try {
    const { data } = await api.post(`/reports/${payload.id}/dispatch`, payload)
    return data
  } catch {
    return { status: 'In Progress', latestUpdate: `Patrol ${payload.unit} dispatched to incident ${payload.id}` }
  }
}

export async function resolveReport(id) {
  await delay(500)
  try {
    const { data } = await api.post(`/reports/${id}/resolve`)
    return data
  } catch {
    return { status: 'Resolved', latestUpdate: `Incident ${id} resolved` }
  }
}

export { CATEGORIES, STATUS_FLOW, MASERU, nearStreet, fmtTime }