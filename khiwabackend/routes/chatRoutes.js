const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

router.post('/chat', auth, chatController.chatWithBot);
router.get('/history/:userId', auth, chatController.getChatHistory);
// routes/chatRoutes.js
router.get('/suggestions', auth, chatController.getSuggestions);
// routes/chatRoutes.js
router.delete('/chat/history/:userId', auth, chatController.clearChatHistory);
module.exports = router;