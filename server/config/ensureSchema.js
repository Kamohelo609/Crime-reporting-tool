const { pool } = require('./db')
const { POLICE_STATIONS } = require('./stationSeed')

/**
 * Keeps an existing database compatible with the current app:
 *  - adds reports.station_id when it is missing
 *  - inserts/updates every police station in Lesotho
 *  - gives each station two patrol units when it has none
 */
async function ensureSchema() {
  const [stationColumn] = await pool.query("SHOW COLUMNS FROM reports LIKE 'station_id'")
  if (!stationColumn.length) {
    await pool.query('ALTER TABLE reports ADD COLUMN station_id INT DEFAULT NULL AFTER user_id')
    try {
      await pool.query(
        'ALTER TABLE reports ADD CONSTRAINT fk_reports_station ' +
          'FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL'
      )
    } catch (err) {
      // The column is still usable even if an FK cannot be added.
      if (err.code !== 'ER_DUP_CONSTRAINT_NAME') {
        console.warn(`[schema] station_id FK not added: ${err.message}`)
      }
    }
  }

  if (POLICE_STATIONS.length) {
    await pool.query(
      `INSERT INTO stations (code, name, lat, lng) VALUES ?
       ON DUPLICATE KEY UPDATE name = VALUES(name), lat = VALUES(lat), lng = VALUES(lng)`,
      [POLICE_STATIONS.map((s) => [s.code, s.name, s.lat, s.lng])]
    )

    await pool.query(
      `INSERT INTO station_units (station_id, unit_name)
       SELECT s.id, CONCAT('Unit ', s.id * 2 - 1)
         FROM stations s
        WHERE NOT EXISTS (SELECT 1 FROM station_units u WHERE u.station_id = s.id)`
    )
    await pool.query(
      `INSERT INTO station_units (station_id, unit_name)
       SELECT s.id, CONCAT('Unit ', s.id * 2)
         FROM stations s
        WHERE (SELECT COUNT(*) FROM station_units u WHERE u.station_id = s.id) = 1`
    )
  }
}

module.exports = { ensureSchema }
