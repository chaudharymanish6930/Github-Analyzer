const mongoose = require('mongoose');

const cachedProfileSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  profile: {
    id: Number,
    login: String,
    name: String,
    avatar_url: String,
    bio: String,
    location: String,
    company: String,
    blog: String,
    email: String,
    twitter_username: String,
    public_repos: Number,
    public_gists: Number,
    followers: Number,
    following: Number,
    created_at: Date,
    updated_at: Date,
    html_url: String,
    hireable: Boolean
  },
  repositories: [{
    id: Number,
    name: String,
    full_name: String,
    description: String,
    html_url: String,
    language: String,
    stargazers_count: Number,
    forks_count: Number,
    watchers_count: Number,
    open_issues_count: Number,
    size: Number,
    default_branch: String,
    topics: [String],
    is_fork: Boolean,
    is_archived: Boolean,
    created_at: Date,
    updated_at: Date,
    pushed_at: Date,
    license: String,
    visibility: String
  }],
  analytics: {
    totalStars: Number,
    totalForks: Number,
    totalWatchers: Number,
    totalSize: Number,
    languages: mongoose.Schema.Types.Mixed,
    topLanguages: [{ language: String, count: Number, percentage: Number }],
    reposByYear: mongoose.Schema.Types.Mixed,
    mostStarred: [{
      name: String,
      stars: Number,
      language: String
    }]
  },
  searchCount: { type: Number, default: 1 },
  lastFetched: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// TTL: auto-delete after 1 hour of inactivity (refresh on re-fetch)
cachedProfileSchema.index({ lastFetched: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('CachedProfile', cachedProfileSchema);
