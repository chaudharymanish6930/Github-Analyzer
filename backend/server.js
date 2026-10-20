const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const session = require('express-session');
require('dotenv').config();

console.log("GitHub Token Status:", process.env.GITHUB_TOKEN ? "Token Loaded Successfully ✅" : "Token Missing ❌");

const app = express();

// Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'mysecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Passport Initialize
app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
    origin: [
    'https://github-analyzer-ashy.vercel.app', 
    'http://localhost:5173',
    'http://localhost:3000'
  ],
    credentials: true
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

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

// Passport Serialize / Deserialize
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
    callbackURL: process.env.CALLBACK_URL || "http://localhost:5000/auth/github/callback"
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
        let existingUser = await User.findOne({ githubId: profile.id });
        
        if (existingUser) {
            return done(null, existingUser);
        }

        const newUser = new User({
            githubId: profile.id,
            username: profile.username,
            displayName: profile.displayName || profile.username,
            avatarUrl: profile.photos?.[0]?.value,
            profileUrl: profile.profileUrl
        });

        await newUser.save();
        return done(null, newUser);
    } catch (err) {
        return done(err, null);
    }
  }
));

// ================= AUTH ROUTES =================
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
    // Client URL env variable se uthayega
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(clientUrl);
  }
);

// Current Logged-in User API
app.get('/api/current-user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ success: true, user: req.user });
    } else {
        res.status(401).json({ success: false, message: "Not authenticated" });
    }
});

// Logout Route
app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) return done(err);
        res.redirect('http://localhost:5173');
    });
});

// ================= PROFILE CACHE & DEEP ANALYTICS ROUTES =================
const profileSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    data: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now, expires: 120 }
});
const ProfileCache = mongoose.model('ProfileCache', profileSchema);

// Basic Profile Overview Route
app.get('/api/github/:username', async (req, res) => {
    try {
        const username = req.params.username.toLowerCase();

        // 1. Check Cache
        const existingUser = await ProfileCache.findOne({ username });
        if (existingUser) {
            return res.status(200).json({ success: true, source: "MongoDB Cache", data: existingUser.data });
        }

        const headers = {};
        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }

        // 2. Fetch Basic Profile Data
        const userResponse = await axios.get(`https://api.github.com/users/${username}`, { headers });
        
        // 3. Fetch Repositories for Language Distribution & Stars
        const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers });
        
        // 4. Fetch Recent User Events for Activity Insights
        const eventsResponse = await axios.get(`https://api.github.com/users/${username}/events?per_page=30`, { headers });

        let totalStars = 0;
        const languages = {};
        reposResponse.data.forEach(repo => {
            totalStars += repo.stargazers_count || 0;
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
        });

        let totalCommitsInRecentEvents = 0;
        const recentActivities = [];

        eventsResponse.data.forEach(event => {
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
                recentActivities.push({
                    type: 'WatchEvent',
                    repo: event.repo.name,
                    time: event.created_at
                });
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

        // Save Cache
        const newCache = new ProfileCache({ username, data: enhancedData });
        await newCache.save();

        res.status(200).json({ success: true, source: "Live GitHub API", data: enhancedData });
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ success: false, message: "GitHub user nahi mila!" });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================= DEEP COMMIT ANALYSIS ROUTE =================
// Analyzes real vs fake/automated commits at repo level
app.get('/api/github/:username/deep-analysis', async (req, res) => {
    try {
        const username = req.params.username.toLowerCase();
        const headers = {};
        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }

        // 1. Fetch User Profile
        const userRes = await axios.get(`https://api.github.com/users/${username}`, { headers });
        
        // 2. Fetch User Repositories (Saari repos lene ke liye per_page=100 kar diya hai)
        const reposRes = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers });

        let repoAnalysis = [];
        let totalRealCommits = 0;
        let totalFakeCommits = 0;
        const languageMap = {};

        // 3. Inspect commits for each repository
        for (let repo of reposRes.data) {
            if (repo.language) {
                languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
            }

            try {
                const commitsRes = await axios.get(`https://api.github.com/repos/${username}/${repo.name}/commits?per_page=20`, { headers });
                
                let realCount = 0;
                let fakeCount = 0;

                commitsRes.data.forEach(commitItem => {
                    const msg = (commitItem.commit?.message || '').toLowerCase().trim();
                    // Automated / bot / dummy commit messages detection
                    const isFake = 
                        msg.includes('auto commit') || 
                        msg.includes('automated') || 
                        msg.includes('bot') || 
                        msg === 'update' || 
                        msg === 'test' || 
                        msg === 'fix' || 
                        msg === 'initial commit' ||
                        (msg.startsWith('update ') && msg.length < 12);

                    if (isFake) {
                        fakeCount++;
                    } else {
                        realCount++;
                    }
                });

                totalRealCommits += realCount;
                totalFakeCommits += fakeCount;

                repoAnalysis.push({
                    repoName: repo.name,
                    language: repo.language || 'Other',
                    stars: repo.stargazers_count || 0,
                    forks: repo.forks_count || 0,
                    realCommits: realCount,
                    fakeCommits: fakeCount,
                    totalInspectedCommits: realCount + fakeCount,
                    authenticityScore: Math.round((realCount / (realCount + fakeCount || 1)) * 100)
                });
            } catch (err) {
                // Ignore repos with no commits / access restrictions
            }
        }

        const grandTotal = totalRealCommits + totalFakeCommits;
        const overallAuthenticityScore = grandTotal > 0 ? Math.round((totalRealCommits / grandTotal) * 100) : 100;

        res.status(200).json({
            success: true,
            data: {
                profile: userRes.data,
                totalRealCommits,
                totalFakeCommits,
                grandTotalCommits: grandTotal,
                overallAuthenticityScore,
                languages: languageMap,
                repoAnalysis
            }
        });
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ success: false, message: "GitHub user nahi mila!" });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});