const axios = require('axios');
const User = require('../models/User');
const { sendTokenResponse } = require('../middleware/auth');
const logger = require('../utils/logger');

// @desc    Initiate GitHub OAuth
// @route   GET /api/auth/github
// @access  Public
exports.githubLogin = (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: 'read:user user:email',
    state: Math.random().toString(36).substring(7)
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
};

// @desc    GitHub OAuth callback
// @route   GET /api/auth/github/callback
// @access  Public
exports.githubCallback = async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token, error: tokenError } = tokenResponse.data;
    if (tokenError || !access_token) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_exchange_failed`);
    }

    // Fetch GitHub user profile
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const githubUser = userResponse.data;

    // Upsert user in MongoDB
    let user = await User.findOne({ githubId: String(githubUser.id) });

    if (!user) {
      // Check if username exists (different githubId)
      const existingUser = await User.findOne({ username: githubUser.login.toLowerCase() });
      if (existingUser && !existingUser.githubId) {
        existingUser.githubId = String(githubUser.id);
        user = existingUser;
      } else if (!existingUser) {
        user = new User({ githubId: String(githubUser.id) });
      } else {
        user = new User({ githubId: String(githubUser.id) });
      }
    }

    // Update user data
    user.username = githubUser.login.toLowerCase();
    user.name = githubUser.name || githubUser.login;
    user.avatar = githubUser.avatar_url;
    user.bio = githubUser.bio;
    user.location = githubUser.location;
    user.company = githubUser.company;
    user.blog = githubUser.blog;
    user.githubProfile = {
      followers: githubUser.followers,
      following: githubUser.following,
      publicRepos: githubUser.public_repos,
      publicGists: githubUser.public_gists,
      createdAt: githubUser.created_at
    };
    user.lastLogin = new Date();

    await user.save();

    // Generate JWT and redirect to frontend
    const token = user.getSignedJwtToken();
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

  } catch (error) {
    logger.error(`GitHub OAuth error: ${error.message}`);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        company: user.company,
        blog: user.blog,
        githubProfile: user.githubProfile,
        preferences: user.preferences,
        searchHistory: user.searchHistory,
        favoriteRepos: user.favoriteRepos,
        recentlyViewed: user.recentlyViewed
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Update user preferences
// @route   PUT /api/auth/preferences
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
