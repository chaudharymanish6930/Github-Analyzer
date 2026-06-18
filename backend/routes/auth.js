const express = require('express');
const router = express.Router();
const { githubLogin, githubCallback, getMe, logout, updatePreferences } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.get('/github', githubLogin);
router.get('/github/callback', githubCallback);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/preferences', protect, updatePreferences);

module.exports = router;
