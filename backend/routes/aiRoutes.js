const express = require('express');
const router = express.Router();
const { parseSentence } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/parse-ai', protect, parseSentence);

module.exports = router; 