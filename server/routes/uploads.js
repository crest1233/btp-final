const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { authenticateToken } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Authenticated upload for images (profile pics, logos, screenshots)
router.post('/', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const buffer = req.file.buffer;
    const folder = req.body.folder || 'inverso/uploads';

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (error, data) => {
        if (error) return reject(error);
        resolve(data);
      });
      stream.end(buffer);
    });

    res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;