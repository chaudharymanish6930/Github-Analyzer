const mongoose = require('mongoose');

const profileCacheSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  profileData: { type: Object, required: true },
  updatedAt: { type: Date, default: Date.now, expires: 3600 } 
});

module.exports = mongoose.model('ProfileCache', profileCacheSchema);