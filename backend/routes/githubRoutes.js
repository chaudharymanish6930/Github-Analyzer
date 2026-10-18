const express = require('express');
const axios = require('axios');
const ProfileCache = require('../models/ProfileCache');

const router = express.Router();

// GET /api/github/profile/:username
router.get('/profile/:username', async (req, res) => {
  const username = req.params.username.toLowerCase();

  try {
    // Step 1: Check MongoDB Cache
    const cachedProfile = await ProfileCache.findOne({ username });

    if (cachedProfile) {
      console.log(`[CACHE HIT] Serving from MongoDB for: ${username}`);
      return res.status(200).json({
        source: 'database-cache',
        data: cachedProfile.profileData
      });
    }

    console.log(`[CACHE MISS] Fetching from GitHub API for: ${username}`);

    // Step 2: Fetch from GitHub REST API
    const githubResponse = await axios.get(
      `https://api.github.com/users/${username}`
    );

    const profileData = githubResponse.data;

    // Step 3: Save fetched data into MongoDB Cache
    await ProfileCache.create({
      username: username,
      profileData: profileData
    });

    return res.status(200).json({
      source: 'github-api',
      data: profileData
    });

  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: 'GitHub User Not Found!' });
    }
    return res.status(500).json({ message: 'Server Error fetching profile data' });
  }
});

module.exports = router;