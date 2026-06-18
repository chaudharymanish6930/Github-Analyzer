# 🔬 GitAnalyzer — GitHub Profile Analytics Platform

A production-ready full-stack MERN application for deep GitHub profile analysis, repository analytics, and developer comparisons.

---

## 📁 Complete Project Structure

```
github-analyzer/
├── backend/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── github.js            # Axios GitHub API client + cache
│   ├── controllers/
│   │   ├── authController.js    # GitHub OAuth + JWT
│   │   ├── githubController.js  # Profile, repos, compare, search
│   │   ├── userController.js    # Favorites, history, preferences
│   │   └── analyticsController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT protect + optionalAuth
│   │   └── errorHandler.js      # Global error handler
│   ├── models/
│   │   ├── User.js              # User schema (OAuth + JWT)
│   │   └── CachedProfile.js     # GitHub profile cache (TTL: 1h)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── github.js
│   │   ├── user.js
│   │   └── analytics.js
│   ├── utils/
│   │   ├── githubService.js     # GitHub API helpers + analytics compute
│   │   └── logger.js            # Winston logger
│   ├── .env.example
│   ├── package.json
│   └── server.js                # Express app entry
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   ├── charts/
    │   │   │   ├── LanguagePieChart.jsx
    │   │   │   ├── StarsBarChart.jsx
    │   │   │   └── RepoGrowthChart.jsx
    │   │   ├── common/
    │   │   │   ├── Layout.jsx
    │   │   │   ├── Navbar.jsx
    │   │   │   ├── SearchBar.jsx
    │   │   │   └── Skeletons.jsx
    │   │   ├── compare/
    │   │   │   └── CompareProfiles.jsx
    │   │   ├── dashboard/
    │   │   │   └── AnalyticsDashboard.jsx
    │   │   └── profile/
    │   │       ├── ProfileHeader.jsx
    │   │       ├── RepoCard.jsx
    │   │       └── RepositoryList.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx   # Auth state (login, logout, user)
    │   │   ├── GitHubContext.jsx # Profile/repo/compare state
    │   │   └── ThemeContext.jsx  # Dark/light mode
    │   ├── hooks/
    │   │   └── useCustomHooks.js # useFavorites, useLocalStorage, useDebounce
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── ProfilePage.jsx   # Tabbed: Overview / Repos / Analytics
    │   │   ├── SearchPage.jsx
    │   │   ├── ComparePage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── FavoritesPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── AuthCallback.jsx
    │   │   └── NotFoundPage.jsx
    │   ├── services/
    │   │   ├── api.js            # Axios instance + interceptors
    │   │   └── githubService.js  # API call wrappers
    │   ├── utils/
    │   │   ├── exportPDF.js      # jsPDF + autotable export
    │   │   └── helpers.js        # formatNumber, timeAgo, colors
    │   ├── App.jsx               # Router + providers
    │   ├── index.css             # Tailwind + glassmorphism design system
    │   └── main.jsx
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🗃️ MongoDB Schema Design

### User Schema
```javascript
{
  githubId: String (unique),
  username: String (unique, lowercase),
  name: String,
  email: String,
  avatar: String,
  bio: String,
  location: String,
  company: String,
  blog: String,
  githubProfile: {
    followers: Number,
    following: Number,
    publicRepos: Number,
    publicGists: Number,
    createdAt: Date
  },
  preferences: {
    theme: 'light' | 'dark' | 'system',
    defaultView: 'grid' | 'list'
  },
  searchHistory: [{ username: String, searchedAt: Date }],
  favoriteRepos: [{
    repoId: Number,
    owner: String,
    name: String,
    fullName: String,
    description: String,
    stars: Number,
    language: String,
    savedAt: Date
  }],
  recentlyViewed: [{ username, name, avatar, viewedAt }],
  lastLogin: Date
}
```

### CachedProfile Schema (TTL: 1 hour)
```javascript
{
  username: String (unique, indexed),
  profile: { ...GitHub user object },
  repositories: [{ ...formatted repo objects }],
  analytics: {
    totalStars, totalForks, totalWatchers, totalSize,
    languages: Object,
    topLanguages: [{ language, count, percentage }],
    reposByYear: Object,
    mostStarred: [{ name, stars, language }]
  },
  searchCount: Number,
  lastFetched: Date
}
```

---

## 🔌 Backend API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/auth/github` | — | Initiate GitHub OAuth |
| GET | `/api/auth/github/callback` | — | OAuth callback, issues JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/auth/logout` | ✅ | Logout (clears cookie) |
| GET | `/api/github/user/:username` | optional | Full profile + repos + analytics |
| GET | `/api/github/repo/:owner/:repo` | — | Single repo details |
| GET | `/api/github/compare/:user1/:user2` | — | Compare two profiles |
| GET | `/api/github/search?q=` | — | Search GitHub users |
| GET | `/api/github/trending` | — | Trending repos |
| GET | `/api/user/dashboard` | ✅ | User's saved data |
| GET | `/api/user/history` | ✅ | Search history |
| DELETE | `/api/user/history` | ✅ | Clear history |
| POST | `/api/user/favorites` | ✅ | Add favorite repo |
| DELETE | `/api/user/favorites/:repoId` | ✅ | Remove favorite |
| PUT | `/api/user/preferences` | ✅ | Update theme/view prefs |
| GET | `/api/analytics/popular` | — | Most searched profiles |
| GET | `/api/analytics/profile/:username` | — | Profile analytics summary |
| GET | `/health` | — | Health check |

---

## ⚙️ Environment Variables Setup

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/github-analyzer
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
GITHUB_TOKEN=ghp_your_personal_access_token
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=GitAnalyzer
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- GitHub OAuth App (Settings → Developer Settings → OAuth Apps)

### 1. Clone and install
```bash
# Backend
cd backend
cp .env.example .env
# Fill in .env values
npm install
npm run dev       # starts on :5000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev       # starts on :5173
```

### 2. Create GitHub OAuth App
1. Go to: https://github.com/settings/developers
2. Click **New OAuth App**
3. Set:
   - Homepage URL: `http://localhost:5173`
   - Callback URL: `http://localhost:5000/api/auth/github/callback`
4. Copy **Client ID** and **Client Secret** to `backend/.env`

### 3. Get GitHub Personal Access Token (Optional — increases rate limit)
1. Go to: https://github.com/settings/tokens
2. Generate new token (classic) with `public_repo` scope
3. Set as `GITHUB_TOKEN` in `backend/.env`

---

## ☁️ Deployment Guide

### Database: MongoDB Atlas
1. Create free cluster at https://cloud.mongodb.com
2. Create database user (username/password)
3. Whitelist all IPs: `0.0.0.0/0` (or specific IPs)
4. Copy connection string → set as `MONGODB_URI`

---

### Backend: Render
1. Push to GitHub
2. Go to https://render.com → **New Web Service**
3. Connect your repo → select `backend/` as root dir
4. Settings:
   ```
   Build Command:   npm install
   Start Command:   npm start
   Node Version:    18
   ```
5. Add all env variables from `backend/.env`
6. Update `GITHUB_CALLBACK_URL` → `https://your-app.onrender.com/api/auth/github/callback`
7. Deploy

---

### Frontend: Vercel
1. Go to https://vercel.com → **New Project**
2. Import your repo → set **Root Directory** to `frontend`
3. Settings:
   ```
   Framework:       Vite
   Build Command:   npm run build
   Output Dir:      dist
   ```
4. Add env variables:
   ```
   VITE_API_URL = https://your-backend.onrender.com/api
   ```
5. Deploy
6. Update your GitHub OAuth App → change callback URL to production backend URL
7. Update `FRONTEND_URL` on Render → your Vercel URL

---

## 🛡️ Security Features

- **Helmet** — HTTP security headers
- **Rate Limiting** — 100 req/15min per IP (configurable)
- **CORS** — Whitelisted origins only
- **JWT** — HttpOnly cookie + Bearer token
- **Input validation** — Mongoose schema validation
- **Error sanitization** — No stack traces in production

## ⚡ Performance Features

- **NodeCache** — In-memory cache for GitHub API responses (10 min TTL)
- **MongoDB TTL index** — Auto-expire cached profiles after 1 hour
- **Pagination** — Up to 1000 repos fetched with pagination
- **Vite code splitting** — vendor, charts, motion chunks
- **Tailwind CSS** — Zero-runtime, purged in production

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Routing | React Router v6 |
| HTTP | Axios with interceptors |
| Charts | Recharts (Area, Bar, Pie, Radar) |
| PDF Export | jsPDF + jspdf-autotable |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | GitHub OAuth 2.0 + JWT (HttpOnly cookies) |
| Caching | node-cache (memory) + MongoDB TTL |
| Logging | Winston |
| Security | Helmet, express-rate-limit, CORS |
| Deployment | Vercel (frontend) + Render (backend) |
