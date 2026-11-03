const path = require('path')
const fs = require('fs')
const http = require('http')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const express = require('express')
const cors = require('cors')
const { Server } = require('socket.io')

const { checkConnection } = require('./config/db')
const { ensureSchema } = require('./config/ensureSchema')
const authRoutes = require('./routes/authRoutes')
const reportRoutes = require('./routes/reportRoutes')
const stationRoutes = require('./routes/stationRoutes')

const app = express()
const httpServer = http.createServer(app)

// ---------- Socket.io ----------
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})
app.set('io', io)

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`)
  socket.on('disconnect', () => console.log(`[socket] disconnected: ${socket.id}`))
})

// ---------- Express middleware ----------
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ---------- Routes ----------
app.get('/api/health', async (req, res) => {
  const db = await checkConnection().catch((e) => ({ ok: false, error: e.message }))
  res.status(db.ok ? 200 : 503).json({
    ok: db.ok,
    database: process.env.DB_NAME || 'safetyconnect',
    error: db.error,
    time: new Date().toISOString()
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/stations', stationRoutes)

// Unknown API route -> JSON 404 (never HTML)
app.use('/api', (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` })
})

// ---------- Serve the built client (production mode) ----------
const clientDist = path.join(__dirname, '..', 'client', 'dist')
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist))
  app.get(/^\/(?!api|uploads).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// ---------- JSON error handler ----------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large — maximum size is 25MB per file' })
  }
  console.error('[error]', err.message)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

// ---------- Start ----------
const PORT = Number(process.env.PORT) || 5000

checkConnection()
  .then(async () => {
    console.log(`✓ MySQL connected (${process.env.DB_NAME || 'safetyconnect'})`)
    await ensureSchema()
    console.log('✓ Police station data ready')
  })
  .catch((e) => console.error(`✗ MySQL connection failed: ${e.message}`))
  .finally(() => {
    httpServer.listen(PORT, () => {
      console.log(`✓ SafetyConnect API   → http://localhost:${PORT}/api`)
      console.log(`✓ Socket.io           → ws://localhost:${PORT}`)
      console.log(`✓ Uploads             → http://localhost:${PORT}/uploads/...`)
    })
  })

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use — stop the other process or change PORT in .env`)
  } else {
    console.error(err.message)
  }
  process.exit(1)
})
