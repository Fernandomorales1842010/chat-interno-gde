const express = require('express');
const router = express.Router();
const { upload, uploadFile } = require('../services/upload.service');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, upload.single('file'), uploadFile);

module.exports = router;
