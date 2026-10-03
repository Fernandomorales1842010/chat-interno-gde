const express = require('express');
const router = express.Router();
const {
  getConversations,
  getOrCreateDirect,
  createGroup,
  getConversation,
  addParticipants,
  markAsRead,
  addMember,
  removeMembers,
  deleteGroup
} = require('../controllers/conversations.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getConversations);
router.get('/:id', authenticate, getConversation);
router.post('/direct', authenticate, getOrCreateDirect);
router.post('/group', authenticate, createGroup);
router.post('/:id/participants', authenticate, addParticipants);
router.post('/:id/members', authenticate, addMember);
router.post('/:id/members/remove', authenticate, removeMembers);
router.delete('/:id', authenticate, deleteGroup);
router.put('/:id/read', authenticate, markAsRead);

module.exports = router;
