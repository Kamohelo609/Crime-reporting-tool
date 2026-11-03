const { pool } = require('../config/db')
const { stationsByDistance } = require('../utils/geoUtils')

/** Load every station with its patrol units. */
async function loadStations() {
  const [rows] = await pool.query(
    `SELECT s.id, s.code, s.name, s.lat, s.lng, u.unit_name
       FROM stations s
       LEFT JOIN station_units u ON u.station_id = s.id
      ORDER BY s.id, u.id`
  )

  const stations = []
  const byId = new Map()
  for (const row of rows) {
    let station = byId.get(row.id)
    if (!station) {
      station = {
        id: row.code,
        dbId: row.id,
        name: row.name,
        lat: Number(row.lat),
        lng: Number(row.lng),
        units: []
      }
      byId.set(row.id, station)
      stations.push(station)
    }
    if (row.unit_name) station.units.push(row.unit_name)
  }

  return stations
}

/** GET /api/stations — stations with their patrol units. */
async function getStations(req, res, next) {
  try {
    return res.json(await loadStations())
  } catch (err) {
    next(err)
  }
}

/** GET /api/stations/nearest?lat=..&lng=..&limit=.. — closest stations first. */
async function getNearestStations(req, res, next) {
  try {
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'Valid lat and lng query parameters are required' })
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 50)
    const stations = await loadStations()
    return res.json(stationsByDistance(lat, lng, stations, limit))
  } catch (err) {
    next(err)
  }
}

module.exports = { getStations, getNearestStations, loadStations }
