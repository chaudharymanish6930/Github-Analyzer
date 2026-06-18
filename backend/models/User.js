const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  githubId: {
    type: String,
    unique: true,
    sparse: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [1, 'Username must be at least 1 character'],
    maxlength: [39, 'Username cannot exceed 39 characters']
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  avatar: String,
  bio: String,
  location: String,
  company: String,
  blog: String,
  githubProfile: {
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    publicRepos: { type: Number, default: 0 },
    publicGists: { type: Number, default: 0 },
    createdAt: Date
  },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    defaultView: { type: String, enum: ['grid', 'list'], default: 'grid' }
  },
  searchHistory: [{
    username: String,
    searchedAt: { type: Date, default: Date.now }
  }],
  favoriteRepos: [{
    repoId: Number,
    owner: String,
    name: String,
    fullName: String,
    description: String,
    stars: Number,
    language: String,
    savedAt: { type: Date, default: Date.now }
  }],
  recentlyViewed: [{
    username: String,
    name: String,
    avatar: String,
    viewedAt: { type: Date, default: Date.now }
  }],
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ username: 1 });
userSchema.index({ githubId: 1 });
userSchema.index({ 'searchHistory.searchedAt': -1 });

// Sign JWT token
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, username: this.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Add to search history (max 20 entries, deduped)
userSchema.methods.addToSearchHistory = async function (username) {
  this.searchHistory = this.searchHistory.filter(
    h => h.username.toLowerCase() !== username.toLowerCase()
  );
  this.searchHistory.unshift({ username, searchedAt: new Date() });
  if (this.searchHistory.length > 20) this.searchHistory = this.searchHistory.slice(0, 20);
  await this.save();
};

// Add to recently viewed (max 10, deduped)
userSchema.methods.addToRecentlyViewed = async function (profile) {
  this.recentlyViewed = this.recentlyViewed.filter(
    v => v.username.toLowerCase() !== profile.username.toLowerCase()
  );
  this.recentlyViewed.unshift({ ...profile, viewedAt: new Date() });
  if (this.recentlyViewed.length > 10) this.recentlyViewed = this.recentlyViewed.slice(0, 10);
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
