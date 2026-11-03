const { upload } = require('../config/multer')

/**
 * Accepts multipart/form-data with a repeated `media` field
 * (photos + videos, max 8 files, 25MB each).
 */
const uploadEvidence = (req, res, next) => {
  upload.array('media', 8)(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'File too large — maximum size is 25MB per file' })
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files — maximum is 8 per report' })
    }
    return res.status(400).json({ message: err.message || 'Upload failed' })
  })
}

module.exports = { uploadEvidence }
