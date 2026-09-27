const express = require('express');
const router = express.Router();
const { getTeams, createTeam, updateTeam } = require('../controllers/teams.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getTeams);
router.post('/', authenticate, authorize('ADMIN', 'SUPERVISOR'), createTeam);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPERVISOR'), updateTeam);

module.exports = router;
