const CachedProfile = require('../models/CachedProfile');

// @desc    Get platform-wide analytics (top searched, etc.)
// @route   GET /api/analytics/popular
// @access  Public
exports.getPopularProfiles = async (req, res) => {
  try {
    const popular = await CachedProfile.find()
      .sort({ searchCount: -1 })
      .limit(10)
      .select('username profile.name profile.avatar_url profile.followers profile.public_repos analytics.totalStars searchCount');

    res.json({ success: true, data: popular });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get profile analytics summary
// @route   GET /api/analytics/profile/:username
// @access  Public
exports.getProfileAnalytics = async (req, res) => {
  try {
    const cached = await CachedProfile.findOne({ username: req.params.username.toLowerCase() });
    if (!cached) {
      return res.status(404).json({ success: false, message: 'Profile not found in cache. Please search for the user first.' });
    }

    res.json({ success: true, data: cached.analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
