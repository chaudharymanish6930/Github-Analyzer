const GitHubService = require('../utils/githubService');
const CachedProfile = require('../models/CachedProfile');
const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Get GitHub user profile + repos + analytics
// @route   GET /api/github/user/:username
// @access  Public
exports.getUserProfile = async (req, res) => {
  const { username } = req.params;
  const { force } = req.query;

  try {
    // Check DB cache first (unless force refresh)
    if (force !== 'true') {
      const cached = await CachedProfile.findOne({ username: username.toLowerCase() });
      if (cached) {
        // Update search count
        cached.searchCount += 1;
        cached.lastFetched = new Date();
        await cached.save();

        // Log to user history if authenticated
        if (req.user) {
          await req.user.addToSearchHistory(username);
          await req.user.addToRecentlyViewed({
            username: cached.profile.login,
            name: cached.profile.name,
            avatar: cached.profile.avatar_url
          });
        }

        return res.json({ success: true, cached: true, data: cached });
      }
    }

    // Fetch fresh from GitHub
    const [profile, allRepos] = await Promise.all([
      GitHubService.getUser(username),
      GitHubService.getAllRepos(username)
    ]);

    const formattedRepos = allRepos.map(GitHubService.formatRepo);
    const analytics = GitHubService.computeAnalytics(allRepos);

    // Upsert in DB cache
    const cacheData = {
      username: username.toLowerCase(),
      profile,
      repositories: formattedRepos,
      analytics,
      lastFetched: new Date()
    };

    const cachedProfile = await CachedProfile.findOneAndUpdate(
      { username: username.toLowerCase() },
      { ...cacheData, $inc: { searchCount: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Log to user history if authenticated
    if (req.user) {
      await req.user.addToSearchHistory(username);
      await req.user.addToRecentlyViewed({
        username: profile.login,
        name: profile.name,
        avatar: profile.avatar_url
      });
    }

    logger.info(`Fetched GitHub profile: ${username}`);
    res.json({ success: true, cached: false, data: cachedProfile });

  } catch (error) {
    logger.error(`getUserProfile error for ${username}: ${error.message}`);
    if (error.isNotFound) {
      return res.status(404).json({ success: false, message: `GitHub user '${username}' not found` });
    }
    if (error.isRateLimit) {
      return res.status(429).json({ success: false, message: error.message, isRateLimit: true });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single repository details
// @route   GET /api/github/repo/:owner/:repo
// @access  Public
exports.getRepository = async (req, res) => {
  const { owner, repo } = req.params;
  try {
    const [repoData, languages] = await Promise.all([
      GitHubService.getRepo(owner, repo),
      GitHubService.getRepoLanguages(owner, repo)
    ]);

    res.json({
      success: true,
      data: {
        ...GitHubService.formatRepo(repoData),
        languages
      }
    });
  } catch (error) {
    if (error.isNotFound) {
      return res.status(404).json({ success: false, message: 'Repository not found' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Compare two GitHub profiles
// @route   GET /api/github/compare/:user1/:user2
// @access  Public
exports.compareProfiles = async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    // Fetch both profiles in parallel
    const [data1, data2] = await Promise.all([
      fetchOrCacheProfile(user1),
      fetchOrCacheProfile(user2)
    ]);

    // Compute comparison metrics
    const comparison = {
      profiles: [data1, data2],
      metrics: {
        followers: [data1.profile.followers, data2.profile.followers],
        following: [data1.profile.following, data2.profile.following],
        publicRepos: [data1.profile.public_repos, data2.profile.public_repos],
        totalStars: [data1.analytics.totalStars, data2.analytics.totalStars],
        totalForks: [data1.analytics.totalForks, data2.analytics.totalForks],
        topLanguages: [data1.analytics.topLanguages, data2.analytics.topLanguages]
      }
    };

    res.json({ success: true, data: comparison });
  } catch (error) {
    if (error.isNotFound) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search GitHub users
// @route   GET /api/github/search?q=username
// @access  Public
exports.searchUsers = async (req, res) => {
  const { q, per_page = 10, page = 1 } = req.query;
  if (!q) return res.status(400).json({ success: false, message: 'Search query is required' });

  try {
    const { cachedRequest } = require('../config/github');
    const data = await cachedRequest('/search/users', {
      q,
      per_page: Math.min(parseInt(per_page), 30),
      page: parseInt(page)
    });

    res.json({
      success: true,
      data: {
        total_count: data.total_count,
        items: data.items.map(u => ({
          id: u.id,
          login: u.login,
          avatar_url: u.avatar_url,
          html_url: u.html_url,
          type: u.type
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get trending repositories
// @route   GET /api/github/trending
// @access  Public
exports.getTrending = async (req, res) => {
  const { language, since = 'weekly' } = req.query;
  try {
    const { cachedRequest } = require('../config/github');
    const dateMap = { daily: 1, weekly: 7, monthly: 30 };
    const days = dateMap[since] || 7;
    const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const query = `created:>${date}${language ? ` language:${language}` : ''}`;
    const data = await cachedRequest('/search/repositories', {
      q: query,
      sort: 'stars',
      order: 'desc',
      per_page: 20
    });

    res.json({
      success: true,
      data: data.items.map(r => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        description: r.description,
        html_url: r.html_url,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        language: r.language,
        owner: { login: r.owner.login, avatar_url: r.owner.avatar_url }
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function
async function fetchOrCacheProfile(username) {
  const cached = await CachedProfile.findOne({ username: username.toLowerCase() });
  if (cached) return cached;

  const [profile, allRepos] = await Promise.all([
    GitHubService.getUser(username),
    GitHubService.getAllRepos(username)
  ]);

  const formattedRepos = allRepos.map(GitHubService.formatRepo);
  const analytics = GitHubService.computeAnalytics(allRepos);

  return CachedProfile.findOneAndUpdate(
    { username: username.toLowerCase() },
    { username: username.toLowerCase(), profile, repositories: formattedRepos, analytics, lastFetched: new Date(), $inc: { searchCount: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}
