const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const session = require('express-session');
const connectMongo = require('connect-mongo');
const MongoStore = connectMongo.MongoStore || connectMongo.default || connectMongo; // v5 aur v6 dono pe chalega
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

console.log('GitHub Token Status:', process.env.GITHUB_TOKEN ? 'Token Loaded Successfully ✅' : 'Token Missing ❌');
console.log('Environment:', isProd ? 'production' : 'development');

const app = express();
app.set('trust proxy', 1); // Render proxy ke peeche hai

app.get('/ping', (req, res) => {
  res.status(200).send('Server is alive!');
});

// ================= 1. CORS (sabse pehle) =================
const allowedOrigins = [
  CLIENT_URL,
  'https://github-analyzer-ashy.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, cb) => {
    // origin undefined = same-origin / Postman / server-to-server
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// ================= 2. Body parser =================
app.use(express.json());

// ================= 3. Database =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// ================= 4. Session (MongoDB store ke saath) =================
app.use(session({
  secret: process.env.SESSION_SECRET || 'mysecretkey',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60 // 1 din
  }),
  cookie: {
    secure: isProd,                    // live par HTTPS only
    sameSite: isProd ? 'none' : 'lax', // Vercel <-> Render cross-domain ke liye
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ================= 5. Passport =================
app.use(passport.initialize());
app.use(passport.session());

// ================= USER SCHEMA & MODEL =================
const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  displayName: { type: String },
  avatarUrl: { type: String },
  profileUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ================= GITHUB STRATEGY =================
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL || 'http://localhost:5000/auth/github/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await User.findOneAndUpdate(
      { githubId: profile.id },
      {
        $set: {
          username: profile.username,
          displayName: profile.displayName || profile.username,
          avatarUrl: profile.photos?.[0]?.value,
          profileUrl: profile.profileUrl
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// ================= AUTH ROUTES =================
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: `${CLIENT_URL}/?login=failed` }),
  (req, res) => {
    // session save hone ke baad hi redirect karo (race condition se bachne ke liye)
    req.session.save(() => res.redirect(CLIENT_URL));
  }
);

app.get('/api/current-user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      success: true,
      user: {
        username: req.user.username,
        displayName: req.user.displayName,
        avatarUrl: req.user.avatarUrl,
        profileUrl: req.user.profileUrl
      }
    });
  } else {
    res.status(401).json({ success: false, message: 'Not authenticated' });
  }
});

app.get('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax'
      });
      res.redirect(CLIENT_URL);
    });
  });
});

// Health check (UptimeRobot ke liye - Render sleep rokne ko)
app.get('/health', (req, res) => res.json({ ok: true }));

// ================= CACHE MODELS =================
const profileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  data: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 min
});
const ProfileCache = mongoose.model('ProfileCache', profileSchema);

const deepSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  data: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now, expires: 900 } // 15 min
});
const DeepCache = mongoose.model('DeepCache', deepSchema);

// ================= HELPERS =================
const getGithubHeaders = () => {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
};

const handleGithubError = (error, res) => {
  if (error.response?.status === 404) {
    return res.status(404).json({ success: false, message: 'GitHub user nahi mila!' });
  }
  if (error.response?.status === 403) {
    return res.status(429).json({
      success: false,
      message: 'GitHub API rate limit khatam ho gaya, thodi der baad try karo.'
    });
  }
  return res.status(500).json({ success: false, error: error.message });
};

// Bot / automated commit detection (word-boundary based, "both"/"robot" ko fake nahi maanega)
const BOT_REGEX = /\b(auto[\s-]?commit|automated|automatic|bot|dependabot|renovate)\b/i;
const DUMMY_MESSAGES = new Set(['update', 'test', 'fix', 'initial commit', 'commit', 'changes']);

const isFakeCommit = (commitItem) => {
  const msg = (commitItem.commit?.message || '').toLowerCase().trim();
  const authorType = commitItem.author?.type; // 'Bot' for GitHub apps
  if (authorType === 'Bot') return true;
  if (BOT_REGEX.test(msg)) return true;
  if (DUMMY_MESSAGES.has(msg)) return true;
  if (msg.startsWith('update ') && msg.length < 12) return true;
  return false;
};

// ================= BASIC PROFILE ROUTE =================
app.get('/api/github/:username', async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();

    const cached = await ProfileCache.findOne({ username });
    if (cached) {
      return res.status(200).json({ success: true, source: 'MongoDB Cache', data: cached.data });
    }

    const headers = getGithubHeaders();

    const [userResponse, reposResponse, eventsResponse] = await Promise.all([
      axios.get(`https://api.github.com/users/${username}`, { headers }),
      axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers }),
      axios.get(`https://api.github.com/users/${username}/events?per_page=30`, { headers })
    ]);

    let totalStars = 0;
    const languages = {};
    reposResponse.data.forEach((repo) => {
      totalStars += repo.stargazers_count || 0;
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });

    let totalCommitsInRecentEvents = 0;
    const recentActivities = [];

    eventsResponse.data.forEach((event) => {
      if (event.type === 'PushEvent') {
        const commitCount = event.payload.commits ? event.payload.commits.length : 1;
        totalCommitsInRecentEvents += commitCount;
        recentActivities.push({
          type: 'PushEvent',
          repo: event.repo.name,
          commitsCount: commitCount,
          message: event.payload.commits?.[0]?.message || 'Pushed commits to repository',
          time: event.created_at
        });
      } else if (event.type === 'CreateEvent') {
        recentActivities.push({
          type: 'CreateEvent',
          repo: event.repo.name,
          refType: event.payload.ref_type,
          time: event.created_at
        });
      } else if (event.type === 'WatchEvent') {
        recentActivities.push({ type: 'WatchEvent', repo: event.repo.name, time: event.created_at });
      }
    });

    const estimatedTotalCommits = (userResponse.data.public_repos * 12) + (totalCommitsInRecentEvents * 5);

    const enhancedData = {
      ...userResponse.data,
      totalStars,
      languages,
      estimatedTotalCommits,
      recentActivities: recentActivities.slice(0, 5),
      topRepos: reposResponse.data.slice(0, 4)
    };

    await ProfileCache.findOneAndUpdate(
      { username },
      { username, data: enhancedData, createdAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, source: 'Live GitHub API', data: enhancedData });
  } catch (error) {
    handleGithubError(error, res);
  }
});

// ================= DEEP COMMIT ANALYSIS ROUTE =================
app.get('/api/github/:username/deep-analysis', async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();

    // Cache check (rate limit bachane ke liye)
    const cached = await DeepCache.findOne({ username });
    if (cached) {
      return res.status(200).json({ success: true, source: 'MongoDB Cache', data: cached.data });
    }

    const headers = getGithubHeaders();

    const [userRes, reposRes] = await Promise.all([
      axios.get(`https://api.github.com/users/${username}`, { headers }),
      axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers })
    ]);

    // Forks skip karo - unke commits user ke apne nahi hote
    const repos = reposRes.data.filter((r) => !r.fork);

    const languageMap = {};
    repos.forEach((repo) => {
      if (repo.language) languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
    });

    const analyzeRepo = async (repo) => {
      try {
        const commitsRes = await axios.get(
          `https://api.github.com/repos/${username}/${repo.name}/commits?per_page=20&author=${username}`,
          { headers }
        );

        let realCount = 0;
        let fakeCount = 0;
        commitsRes.data.forEach((c) => (isFakeCommit(c) ? fakeCount++ : realCount++));

        return {
          repoName: repo.name,
          language: repo.language || 'Other',
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          realCommits: realCount,
          fakeCommits: fakeCount,
          totalInspectedCommits: realCount + fakeCount,
          authenticityScore: Math.round((realCount / (realCount + fakeCount || 1)) * 100)
        };
      } catch (err) {
        return null; // empty repo / access issue
      }
    };

    // Batches mein parallel chalao (10 ek saath) - sequential se bahut fast
    const repoAnalysis = [];
    const BATCH_SIZE = 10;
    for (let i = 0; i < repos.length; i += BATCH_SIZE) {
      const batch = repos.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(analyzeRepo));
      results.forEach((r) => r && repoAnalysis.push(r));
    }

    const totalRealCommits = repoAnalysis.reduce((s, r) => s + r.realCommits, 0);
    const totalFakeCommits = repoAnalysis.reduce((s, r) => s + r.fakeCommits, 0);
    const grandTotal = totalRealCommits + totalFakeCommits;
    const overallAuthenticityScore = grandTotal > 0 ? Math.round((totalRealCommits / grandTotal) * 100) : 100;

    const data = {
      profile: userRes.data,
      totalRealCommits,
      totalFakeCommits,
      grandTotalCommits: grandTotal,
      overallAuthenticityScore,
      languages: languageMap,
      repoAnalysis
    };

    await DeepCache.findOneAndUpdate(
      { username },
      { username, data, createdAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, source: 'Live GitHub API', data });
  } catch (error) {
    handleGithubError(error, res);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});