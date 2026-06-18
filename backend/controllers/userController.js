const User = require('../models/User');

// @desc    Get user dashboard data
// @route   GET /api/user/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      data: {
        searchHistory: user.searchHistory,
        recentlyViewed: user.recentlyViewed,
        favoriteRepos: user.favoriteRepos,
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add repository to favorites
// @route   POST /api/user/favorites
// @access  Private
exports.addFavorite = async (req, res) => {
  const { repoId, owner, name, fullName, description, stars, language } = req.body;
  if (!repoId || !owner || !name) {
    return res.status(400).json({ success: false, message: 'repoId, owner, and name are required' });
  }

  try {
    const user = await User.findById(req.user.id);
    const alreadyFav = user.favoriteRepos.some(r => r.repoId === repoId);
    if (alreadyFav) {
      return res.status(400).json({ success: false, message: 'Repository already in favorites' });
    }

    user.favoriteRepos.push({ repoId, owner, name, fullName, description, stars, language });
    await user.save();

    res.status(201).json({ success: true, message: 'Added to favorites', favoriteRepos: user.favoriteRepos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove repository from favorites
// @route   DELETE /api/user/favorites/:repoId
// @access  Private
exports.removeFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.favoriteRepos = user.favoriteRepos.filter(r => r.repoId !== parseInt(req.params.repoId));
    await user.save();

    res.json({ success: true, message: 'Removed from favorites', favoriteRepos: user.favoriteRepos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get search history
// @route   GET /api/user/history
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user.searchHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear search history
// @route   DELETE /api/user/history
// @access  Private
exports.clearHistory = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { searchHistory: [], recentlyViewed: [] });
    res.json({ success: true, message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update preferences
// @route   PUT /api/user/preferences
// @access  Private
exports.updatePreferences = async (req, res) => {
  try {
    const { theme, defaultView } = req.body;
    const user = await User.findById(req.user.id);

    if (theme) user.preferences.theme = theme;
    if (defaultView) user.preferences.defaultView = defaultView;

    await user.save();
    res.json({ success: true, preferences: user.preferences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
