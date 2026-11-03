const bcrypt = require('bcryptjs')
const { pool } = require('../config/db')
const { signToken } = require('../middleware/authMiddleware')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function publicUser(row) {
  const user = {
    id: (row.role === 'officer' ? 'O-' : 'C-') + row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role
  }
  if (row.phone) user.phone = row.phone
  if (row.role === 'officer') user.badge = row.badge
  return user
}

/** POST /api/auth/register — citizens only. */
async function register(req, res, next) {
  try {
    const { fullName, phone, email, password } = req.body || {}

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ message: 'Full name is required' })
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ message: 'Phone number is required' })
    }
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!EMAIL_RE.test(normalizedEmail)) {
      return res.status(400).json({ message: 'A valid email address is required' })
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const [dupe] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail])
    if (dupe.length) {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(String(password), 10)
    const [result] = await pool.query(
      'INSERT INTO users (full_name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [String(fullName).trim(), String(phone).trim(), normalizedEmail, passwordHash, 'citizen']
    )

    const row = {
      id: result.insertId,
      full_name: fullName,
      phone,
      email: normalizedEmail,
      role: 'citizen'
    }

    return res.status(201).json({ user: publicUser(row), token: signToken(row) })
  } catch (err) {
    next(err)
  }
}

/** POST /api/auth/login — citizens (email) and officers (badge or email). */
async function login(req, res, next) {
  try {
    const { email, password, role } = req.body || {}
    const identifier = String(email || '').trim()

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Account and password are required' })
    }

    let rows
    const isBadge = identifier.startsWith('#') || /^\d+$/.test(identifier)
    if (isBadge) {
      const digits = identifier.replace(/\D/g, '')
      ;[rows] = await pool.query('SELECT * FROM users WHERE REPLACE(badge, "#", "") = ?', [digits])
    } else {
      ;[rows] = await pool.query('SELECT * FROM users WHERE email = ?', [identifier.toLowerCase()])
    }

    const user = rows[0]
    const valid = user && (await bcrypt.compare(String(password), user.password_hash))
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (role && user.role !== role) {
      return res.status(403).json({
        message: role === 'officer'
          ? 'This account is not a police officer account'
          : 'This account is not a citizen account'
      })
    }

    return res.json({ user: publicUser(user), token: signToken(user) })
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login }
