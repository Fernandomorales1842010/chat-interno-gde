const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/users.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUserById);
router.post('/', authenticate, authorize('ADMIN', 'SUPERVISOR', 'IT'), createUser);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteUser);

module.exports = router;
