const express = require('express');
const router = express.Router();
const { getPopularProfiles, getProfileAnalytics } = require('../controllers/analyticsController');

router.get('/popular', getPopularProfiles);
router.get('/profile/:username', getProfileAnalytics);

module.exports = router;
