const path = require('path')
const fs = require('fs')
const multer = require('multer')

const IMAGES_DIR = path.join(__dirname, '..', 'uploads', 'images')
const VIDEOS_DIR = path.join(__dirname, '..', 'uploads', 'videos')

// Make sure upload folders exist
;[IMAGES_DIR, VIDEOS_DIR].forEach((dir) => fs.mkdirSync(dir, { recursive: true }))

const ALLOWED = /^(image\/(jpeg|png|gif|webp)|video\/(mp4|webm|quicktime|x-msvideo))$/

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, file.mimetype.startsWith('video/') ? VIDEOS_DIR : IMAGES_DIR)
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin'
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, safe)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, files: 8 }, // 25MB per file, max 8 files
  fileFilter(req, file, cb) {
    if (ALLOWED.test(file.mimetype)) return cb(null, true)
    cb(new Error('Only JPG, PNG, GIF, WEBP, MP4, WEBM, MOV or AVI files are allowed'))
  }
})

module.exports = { upload, IMAGES_DIR, VIDEOS_DIR }
