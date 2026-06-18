import api from './api';

export const githubService = {
  getProfile: (username, force = false) =>
    api.get(`/github/user/${username}`, { params: force ? { force: 'true' } : {} }),

  getRepo: (owner, repo) => api.get(`/github/repo/${owner}/${repo}`),

  compareProfiles: (user1, user2) => api.get(`/github/compare/${user1}/${user2}`),

  searchUsers: (q, page = 1) => api.get('/github/search', { params: { q, page, per_page: 10 } }),

  getTrending: (language, since = 'weekly') =>
    api.get('/github/trending', { params: { language, since } })
};

export const userService = {
  getDashboard: () => api.get('/user/dashboard'),

  addFavorite: (repoData) => api.post('/user/favorites', repoData),

  removeFavorite: (repoId) => api.delete(`/user/favorites/${repoId}`),

  getHistory: () => api.get('/user/history'),

  clearHistory: () => api.delete('/user/history'),

  updatePreferences: (prefs) => api.put('/user/preferences', prefs)
};

export const analyticsService = {
  getPopular: () => api.get('/analytics/popular'),
  getProfileAnalytics: (username) => api.get(`/analytics/profile/${username}`)
};
