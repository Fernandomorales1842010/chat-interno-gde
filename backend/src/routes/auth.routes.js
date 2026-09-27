const express = require('express');
const router = express.Router();
const { login, logout, me, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
