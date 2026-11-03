const { pool } = require('../config/db')
const { nearStreet, relativeTime, haversineKm, nearestStation } = require('../utils/geoUtils')
const { loadStations } = require('./stationController')

const CATEGORIES = ['Vandalism', 'Theft', 'Assault', 'Burglary', 'Harassment', 'Fraud', 'Other']

const REPORT_SELECT = `
  SELECT r.*, s.code AS station_code, s.name AS station_name,
         s.lat AS station_lat, s.lng AS station_lng
    FROM reports r
    LEFT JOIN stations s ON s.id = r.station_id
`

const fileUrl = (row) => `/uploads/${row.media_type === 'video' ? 'videos' : 'images'}/${row.file_path.split('/').pop()}`

/** DB row -> API shape the client already understands. */
function rowToReport(row, media = []) {
  const lat = Number(row.lat)
  const lng = Number(row.lng)
  const station = row.station_code
    ? {
        id: row.station_code,
        name: row.station_name,
        lat: Number(row.station_lat),
        lng: Number(row.station_lng),
        distanceKm: haversineKm(lat, lng, Number(row.station_lat), Number(row.station_lng))
      }
    : null

  return {
    id: row.ref_id,
    token: row.token,
    category: row.category,
    description: row.description,
    lat,
    lng,
    address: row.address || nearStreet(lat, lng),
    status: row.status,
    reporterType: row.reporter_type,
    receivedAt: row.created_at,
    submittedAt: row.created_at,
    latestUpdate: row.latest_update,
    station,
    media
  }
}

/** Batch-load media for a set of reports. Returns Map<reportId, media[]>. */
async function loadMedia(reportIds) {
  const map = new Map(reportIds.map((id) => [id, []]))
  if (!reportIds.length) return map
  const [mediaRows] = await pool.query(
    'SELECT id, report_id, media_type, original_name, file_path FROM report_media WHERE report_id IN (?) ORDER BY id',
    [reportIds]
  )
  for (const m of mediaRows) {
    const list = map.get(m.report_id)
    if (list) {
      list.push({ type: m.media_type, name: m.original_name, url: fileUrl(m) })
    }
  }
  return map
}

function emitReport(req, event, report) {
  const io = req.app.get('io')
  if (io) io.emit(event, report)
}

const reportNotFound = (res) => res.status(404).json({ message: 'No report found for this reference' })

/** POST /api/reports — create a report (multipart, optional auth). */
async function createReport(req, res, next) {
  try {
    const { category, description, lat, lng, address, anonymous } = req.body || {}

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Please choose a valid crime category' })
    }
    if (!description || String(description).trim().length < 10) {
      return res.status(400).json({ message: 'Please describe the incident (min 10 characters)' })
    }

    const numLat = Number(lat)
    const numLng = Number(lng)
    if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) {
      return res.status(400).json({ message: 'A valid location (lat / lng) is required' })
    }

    const anon = String(anonymous ?? 'true') === 'true'
    const reporterType = anon ? 'Anonymous' : 'Registered'
    const userId = !anon && req.user ? req.user.id : null
    const resolvedAddress = String(address || '').trim() || nearStreet(numLat, numLng)

    // Route the report to the nearest station (or a station the citizen picked).
    const stations = await loadStations()
    const requestedStationId = String(req.body?.stationId || '').trim().toUpperCase()
    let station = requestedStationId
      ? stations.find((s) => String(s.id).toUpperCase() === requestedStationId)
      : null
    if (!station) {
      station = nearestStation(numLat, numLng, stations)?.station || null
    }

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      // Insert with unique temp refs, then stamp the real INC-####/REP-####-X ids.
      const tmp = `TMP-${Date.now()}-${Math.round(Math.random() * 1e9)}`
      const [result] = await conn.query(
        `INSERT INTO reports
           (ref_id, token, category, description, lat, lng, address, status,
            anonymous, reporter_type, user_id, station_id, latest_update)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, 'Report received')`,
        [
          tmp,
          tmp,
          category,
          String(description).trim(),
          numLat,
          numLng,
          resolvedAddress,
          anon ? 1 : 0,
          reporterType,
          userId,
          station?.dbId ?? null
        ]
      )

      const insertId = result.insertId
      const refId = `INC-${1000 + insertId}`
      const token = `REP-${1000 + insertId}-${String.fromCharCode(65 + (insertId % 26))}`
      await conn.query('UPDATE reports SET ref_id = ?, token = ? WHERE id = ?', [refId, token, insertId])

      if (req.files && req.files.length) {
        const values = req.files.map((f) => [
          insertId,
          f.mimetype.startsWith('video/') ? 'video' : 'image',
          f.originalname,
          `/uploads/${f.mimetype.startsWith('video/') ? 'videos' : 'images'}/${f.filename}`
        ])
        await conn.query(
          'INSERT INTO report_media (report_id, media_type, original_name, file_path) VALUES ?',
          [values]
        )
      }

      await conn.query('INSERT INTO report_updates (report_id, note) VALUES (?, ?)', [
        insertId,
        'Report received'
      ])

      const [rows] = await conn.query(`${REPORT_SELECT} WHERE r.id = ?`, [insertId])
      await conn.commit()

      const media = (await loadMedia([insertId])).get(insertId)
      const report = rowToReport(rows[0], media)

      emitReport(req, 'incident:new', report)
      return res.status(201).json(report)
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  } catch (err) {
    next(err)
  }
}

/** GET /api/reports — full dispatch feed (officer portal). */
async function listReports(req, res, next) {
  try {
    const [rows] = await pool.query(
      `${REPORT_SELECT} ORDER BY r.created_at DESC, r.id DESC LIMIT 100`
    )
    const media = await loadMedia(rows.map((r) => r.id))
    return res.json(rows.map((r) => rowToReport(r, media.get(r.id) || [])))
  } catch (err) {
    next(err)
  }
}

/** GET /api/reports/public — privacy-safe feed for the public map. */
async function publicIncidents(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT ref_id, category, lat, lng, status, created_at
         FROM reports ORDER BY created_at DESC, id DESC LIMIT 20`
    )
    return res.json(
      rows.map((r) => ({
        id: r.ref_id,
        lat: Number(r.lat),
        lng: Number(r.lng),
        title: r.category,
        category: r.category,
        status: r.status,
        time: relativeTime(r.created_at)
      }))
    )
  } catch (err) {
    next(err)
  }
}

/** GET /api/reports/track/:token — anonymous tracking lookup. */
async function trackReport(req, res, next) {
  try {
    const token = String(req.params.token || '').trim()
    const [rows] = await pool.query(`${REPORT_SELECT} WHERE UPPER(r.token) = UPPER(?) LIMIT 1`, [
      token
    ])
    if (!rows.length) {
      return res.status(404).json({ message: 'No report found for this token' })
    }

    const row = rows[0]
    const media = (await loadMedia([row.id])).get(row.id) || []
    const report = rowToReport(row, media)

    // Privacy: hide the raw description for anonymous reports.
    if (row.anonymous) {
      report.description = 'Incident details are masked for anonymous reports.'
    }
    delete report.anonymous

    return res.json(report)
  } catch (err) {
    next(err)
  }
}

/** POST /api/reports/:id/dispatch — send a patrol unit. */
async function dispatchUnit(req, res, next) {
  try {
    const refId = req.params.id
    const unit = String(req.body?.unit || 'Unit 1').trim()

    const [rows] = await pool.query(`${REPORT_SELECT} WHERE r.ref_id = ? LIMIT 1`, [refId])
    if (!rows.length) return reportNotFound(res)

    const note = `Patrol ${unit} dispatched to incident ${refId}`
    await pool.query(
      "UPDATE reports SET status = 'In Progress', latest_update = ? WHERE ref_id = ?",
      [note, refId]
    )
    await pool.query('INSERT INTO report_updates (report_id, note) VALUES (?, ?)', [rows[0].id, note])

    const [updated] = await pool.query(`${REPORT_SELECT} WHERE r.id = ?`, [rows[0].id])
    const media = (await loadMedia([rows[0].id])).get(rows[0].id) || []
    const report = rowToReport(updated[0], media)

    emitReport(req, 'incident:update', report)
    return res.json({ status: report.status, latestUpdate: note, report })
  } catch (err) {
    next(err)
  }
}

/** POST /api/reports/:id/resolve — close a case. */
async function resolveReport(req, res, next) {
  try {
    const refId = req.params.id

    const [rows] = await pool.query(`${REPORT_SELECT} WHERE r.ref_id = ? LIMIT 1`, [refId])
    if (!rows.length) return reportNotFound(res)

    const note = `Incident ${refId} resolved`
    await pool.query(
      "UPDATE reports SET status = 'Resolved', latest_update = ? WHERE ref_id = ?",
      [note, refId]
    )
    await pool.query('INSERT INTO report_updates (report_id, note) VALUES (?, ?)', [rows[0].id, note])

    const [updated] = await pool.query(`${REPORT_SELECT} WHERE r.id = ?`, [rows[0].id])
    const media = (await loadMedia([rows[0].id])).get(rows[0].id) || []
    const report = rowToReport(updated[0], media)

    emitReport(req, 'incident:update', report)
    return res.json({ status: report.status, latestUpdate: note, report })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createReport,
  listReports,
  publicIncidents,
  trackReport,
  dispatchUnit,
  resolveReport
}
