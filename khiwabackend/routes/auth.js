const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/activate', authController.activateAccount);

module.exports = router;