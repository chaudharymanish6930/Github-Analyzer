const express = require('express');
const router = express.Router();
const { getDashboard, addFavorite, removeFavorite, getHistory, clearHistory, updatePreferences } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect); // All user routes require auth

router.get('/dashboard', getDashboard);
router.get('/history', getHistory);
router.delete('/history', clearHistory);
router.put('/preferences', updatePreferences);
router.post('/favorites', addFavorite);
router.delete('/favorites/:repoId', removeFavorite);

module.exports = router;
