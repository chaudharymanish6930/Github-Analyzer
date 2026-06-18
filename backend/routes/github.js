const express = require('express');
const router = express.Router();
const {
  getUserProfile, getRepository, compareProfiles, searchUsers, getTrending
} = require('../controllers/githubController');
const { optionalAuth } = require('../middleware/auth');

router.get('/user/:username', optionalAuth, getUserProfile);
router.get('/repo/:owner/:repo', getRepository);
router.get('/compare/:user1/:user2', compareProfiles);
router.get('/search', searchUsers);
router.get('/trending', getTrending);

module.exports = router;
