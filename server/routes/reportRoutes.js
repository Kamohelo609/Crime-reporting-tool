const express = require('express')
const {
  createReport,
  listReports,
  publicIncidents,
  trackReport,
  dispatchUnit,
  resolveReport
} = require('../controllers/reportController')
const { optionalAuth } = require('../middleware/authMiddleware')
const { uploadEvidence } = require('../middleware/uploadMiddleware')

const router = express.Router()

router.get('/', optionalAuth, listReports)          // dispatch feed
router.get('/public', publicIncidents)              // public map feed
router.get('/track/:token', trackReport)            // anonymous tracking lookup
router.post('/', optionalAuth, uploadEvidence, createReport)
router.post('/:id/dispatch', optionalAuth, dispatchUnit)
router.post('/:id/resolve', optionalAuth, resolveReport)

module.exports = router
