const express = require('express');
const router = express.Router();
const { getMessages, deleteMessage } = require('../controllers/messages.controller');
const { authenticate } = require('../middleware/auth');

router.get('/:conversationId', authenticate, getMessages);
router.delete('/:id', authenticate, deleteMessage);

module.exports = router;
