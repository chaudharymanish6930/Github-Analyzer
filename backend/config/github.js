const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Cache with 10 minute TTL
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const githubAPI = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github.v3+json',
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
    })
  },
  timeout: 15000
});

// Response interceptor for rate limit handling
githubAPI.interceptors.response.use(
  (response) => {
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];
    if (remaining && parseInt(remaining) < 10) {
      logger.warn(`GitHub API rate limit low: ${remaining} remaining. Resets at ${new Date(reset * 1000).toISOString()}`);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 403) {
      const reset = error.response.headers['x-ratelimit-reset'];
      const resetTime = reset ? new Date(reset * 1000).toISOString() : 'unknown';
      error.message = `GitHub API rate limit exceeded. Resets at ${resetTime}`;
      error.isRateLimit = true;
    }
    if (error.response?.status === 404) {
      error.message = 'GitHub resource not found';
      error.isNotFound = true;
    }
    return Promise.reject(error);
  }
);

const cachedRequest = async (url, params = {}) => {
  const cacheKey = `${url}:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.debug(`Cache hit: ${url}`);
    return cached;
  }
  const response = await githubAPI.get(url, { params });
  cache.set(cacheKey, response.data);
  return response.data;
};

module.exports = { githubAPI, cachedRequest, cache };
