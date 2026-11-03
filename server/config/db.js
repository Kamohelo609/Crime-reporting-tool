const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'safetyconnect',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: 'local'
})

/** Verify the database is reachable. Returns { ok, error? }. */
async function checkConnection() {
  const conn = await pool.getConnection()
  try {
    await conn.ping()
    return { ok: true }
  } finally {
    conn.release()
  }
}

module.exports = { pool, checkConnection }
