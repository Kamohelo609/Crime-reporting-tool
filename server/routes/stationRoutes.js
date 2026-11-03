const express = require('express')
const { getStations, getNearestStations } = require('../controllers/stationController')

const router = express.Router()

router.get('/', getStations)
router.get('/nearest', getNearestStations)

module.exports = router
