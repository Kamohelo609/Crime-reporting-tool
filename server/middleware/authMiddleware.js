const jwt = require('jsonwebtoken')

const SECRET = () => process.env.JWT_SECRET || 'safetyconnect-dev-secret'

function extractToken(req) {
  const header = req.headers.authorization || ''
  if (header.startsWith('Bearer ')) return header.slice(7).trim()
  return null
}

function decode(req) {
  const token = extractToken(req)
  if (!token) return null
  try {
    return jwt.verify(token, SECRET())
  } catch {
    return null
  }
}

/** Require a valid JWT — rejects with 401 otherwise. */
function protect(req, res, next) {
  const payload = decode(req)
  if (!payload) {
    return res.status(401).json({ message: 'Not authorised — missing or invalid token' })
  }
  req.user = payload
  next()
}

/** Attach req.user when a valid token is present, but never reject. */
function optionalAuth(req, res, next) {
  req.user = decode(req)
  next()
}

/** protect + officer role check. */
function officerOnly(req, res, next) {
  protect(req, res, () => {
    if (req.user.role !== 'officer') {
      return res.status(403).json({ message: 'Police officer access only' })
    }
    next()
  })
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, badge: user.badge || null },
    SECRET(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

module.exports = { protect, optionalAuth, officerOnly, signToken }
