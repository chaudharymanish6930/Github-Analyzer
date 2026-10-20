import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import './App.css';

// Live Render Backend URL (Dynamic)
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://github-analyzer-zz5r.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'search', 'compare'

  // Logged-in User Deep Analysis State
  const [myDeepData, setMyDeepData] = useState(null);
  const [myLoading, setMyLoading] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  
  // Guest Search Data (Basic profile only)
  const [guestProfile, setGuestProfile] = useState(null);
  const [guestLoading, setGuestLoading] = useState(false);

  // Auth Search Data (Deep analytics)
  const [searchedDeepData, setSearchedDeepData] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');

  // Comparison States (Step 3 - Rich Matrix)
  const [compareUser1, setCompareUser1] = useState('');
  const [compareUser2, setCompareUser2] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Check logged-in user on mount (Sirf ek hi useEffect rahega yahan)
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/current-user`, { withCredentials: true })
      .then(res => {
        if (res.data.success && res.data.user) {
          const loggedInUser = res.data.user;
          setUser(loggedInUser);
          fetchDeepAnalysis(loggedInUser.username, setMyDeepData, setMyLoading);
        }
      })
      .catch(err => console.log("Guest mode active"));
  }, []);

  const fetchDeepAnalysis = async (username, setDataFunc, setLoadingFunc) => {
    setLoadingFunc(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/github/${username.toLowerCase()}/deep-analysis`);
      setDataFunc(response.data.data);
    } catch (err) {
      console.error("Deep analysis fetch error", err);
    } finally {
      setLoadingFunc(false);
    }
  };

  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/github`;
  };

  const handleLogout = () => {
    window.location.href = `${API_BASE_URL}/auth/logout`;
  };

  // Guest Search Handler
  const handleGuestSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setGuestLoading(true);
    setError('');
    setGuestProfile(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/github/${searchQuery.trim().toLowerCase()}`);
      setGuestProfile(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'GitHub user nahi mila!');
    } finally {
      setGuestLoading(false);
    }
  };

  // Authenticated Search Handler
  const handleAuthSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setError('');
    setSearchedDeepData(null);
    await fetchDeepAnalysis(searchQuery.trim(), setSearchedDeepData, setSearchLoading);
  };

  // Enhanced Comparison Engine Logic
  const handleCompareSubmit = async (e) => {
    e.preventDefault();
    if (!compareUser1.trim() || !compareUser2.trim()) return;

    setCompareLoading(true);
    setCompareResult(null);

    try {
      const [res1, res2] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/github/${compareUser1.trim().toLowerCase()}/deep-analysis`),
        axios.get(`${API_BASE_URL}/api/github/${compareUser2.trim().toLowerCase()}/deep-analysis`)
      ]);

      const u1 = res1.data.data;
      const u2 = res2.data.data;

      // Extract primary language for each user
      const getTopLanguage = (langObj) => {
        if (!langObj || Object.keys(langObj).length === 0) return 'N/A';
        return Object.keys(langObj).reduce((a, b) => langObj[a] > langObj[b] ? a : b);
      };

      u1.primaryLanguage = getTopLanguage(u1.languages);
      u2.primaryLanguage = getTopLanguage(u2.languages);

      // Smart Weighted Verdict Calculation
      const score1 = (u1.totalRealCommits > 0 ? u1.overallAuthenticityScore : 0) + (u1.totalRealCommits * 0.5);
      const score2 = (u2.totalRealCommits > 0 ? u2.overallAuthenticityScore : 0) + (u2.totalRealCommits * 0.5);

      let winnerText = "";
      if (score1 > score2) {
        winnerText = `👑 @${u1.profile.login} dominates with higher real commit contributions (${u1.totalRealCommits} real commits, ${u1.overallAuthenticityScore}% score)!`;
      } else if (score2 > score1) {
        winnerText = `👑 @${u2.profile.login} dominates with higher real commit contributions (${u2.totalRealCommits} real commits, ${u2.overallAuthenticityScore}% score)!`;
      } else {
        winnerText = `🤝 Both developer profiles exhibit equal open-source performance!`;
      }

      setCompareResult({
        user1: u1,
        user2: u2,
        winner: winnerText
      });
    } catch (err) {
      console.error("Comparison error", err);
    } finally {
      setCompareLoading(false);
    }
  };

  const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f87171', '#ec4899'];

  // ================= 1. GUEST VIEW =================
  if (!user) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="logo-area">
            <h2>⚡ GitPulse Analyzer</h2>
          </div>
          <div className="auth-area">
            <button onClick={handleLogin} className="github-login-btn">
              <svg height="20" width="20" viewBox="0 0 16 16" fill="#fff"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
              Login with GitHub
            </button>
          </div>
        </header>

        <div className="hero-section">
          <h1>GitHub Profile Overview</h1>
          <p>Search any GitHub user for quick overview. Login with GitHub to unlock deep commit authenticity analysis.</p>
          
          <form onSubmit={handleGuestSearchSubmit} className="search-box-wrapper">
            <input
              type="text"
              placeholder="Enter GitHub username (e.g., torvalds)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="modern-search-input"
            />
            <button type="submit" className="modern-search-btn">Search</button>
          </form>
        </div>

        {guestLoading && <div className="loader-container"><p>Fetching basic profile...</p></div>}
        {error && <div className="error-banner">{error}</div>}

        {guestProfile && (
          <div className="results-container">
            <div className="profile-card-modern">
              <div className="profile-top">
                <img src={guestProfile.avatar_url} alt="Avatar" className="profile-avatar-lg" />
                <div className="profile-meta">
                  <h2>{guestProfile.name || guestProfile.login}</h2>
                  <a href={guestProfile.html_url} target="_blank" rel="noreferrer" className="username-link">
                    @{guestProfile.login} ↗
                  </a>
                  <p className="profile-bio">{guestProfile.bio || 'No public bio provided.'}</p>
                </div>
              </div>

              <div className="stats-cards-grid">
                <div className="stat-box">
                  <span className="stat-label">Repositories</span>
                  <span className="stat-value">{guestProfile.public_repos}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Followers</span>
                  <span className="stat-value">{guestProfile.followers}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Following</span>
                  <span className="stat-value">{guestProfile.following}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Total Stars</span>
                  <span className="stat-value">{guestProfile.totalStars || 0}</span>
                </div>
              </div>
            </div>

            <div className="locked-banner-card">
              <div className="locked-content">
                <span className="lock-icon">🔒</span>
                <h3>Deep Commit Verification Locked</h3>
                <p>Want to check real vs. automated/fake commits, repository breakdown, and authenticity score for <strong>@{guestProfile.login}</strong>?</p>
                <button onClick={handleLogin} className="unlock-cta-btn">
                  Login with GitHub to Unlock Full Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= 2. LOGGED-IN SAAS DASHBOARD VIEW =================
  const myLanguages = myDeepData?.languages ? Object.keys(myDeepData.languages).map(lang => ({ name: lang, value: myDeepData.languages[lang] })) : [];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">⚡</div>
          <h2>GitPulse</h2>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span>🏠</span> Dashboard
          </button>
          <button className={`nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
            <span>🔍</span> Search User
          </button>
          <button className={`nav-item ${activeTab === 'compare' ? 'active' : ''}`} onClick={() => setActiveTab('compare')}>
            <span>⚖️</span> Compare
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item"><span>⚙️</span> Settings</button>
          <button className="nav-item logout-nav" onClick={handleLogout}><span>🚪</span> Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h3>{activeTab === 'dashboard' ? 'My Deep Dashboard' : activeTab === 'search' ? 'Search Developer' : 'Profile Comparison'}</h3>
          <div className="user-profile-pill">
            <img src={user.avatarUrl} alt="avatar" className="pill-avatar" />
            <span className="pill-name">{user.displayName || user.username}</span>
          </div>
        </header>

        <div className="tab-content-area">
          {activeTab === 'dashboard' && (
            <div className="view-container">
              <h2>Welcome, {user.displayName || user.username} 👋</h2>
              <p className="subtitle">Here is your in-depth commit verification and repository analytics.</p>

              {myLoading ? (
                <div className="loader-container"><p>Analyzing your repository commits for real vs fake detection...</p></div>
              ) : myDeepData ? (
                <div className="dashboard-stack" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* 1. Profile & Stats Card */}
                  <div className="profile-card-modern">
                    <div className="profile-top">
                      <img src={myDeepData.profile.avatar_url} alt="Avatar" className="profile-avatar-lg" />
                      <div className="profile-meta">
                        <h2>{myDeepData.profile.name || myDeepData.profile.login}</h2>
                        <a href={myDeepData.profile.html_url} target="_blank" rel="noreferrer" className="username-link">
                          @{myDeepData.profile.login} ↗
                        </a>
                        <p className="profile-bio">{myDeepData.profile.bio || 'Full-Stack Developer & Open Source Contributor'}</p>
                      </div>
                    </div>

                    <div className="stats-cards-grid">
                      <div className="stat-box">
                        <span className="stat-label">Authenticity</span>
                        <span className="stat-value" style={{ color: '#34d399' }}>{myDeepData.overallAuthenticityScore}%</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-label">Real Commits</span>
                        <span className="stat-value" style={{ color: '#38bdf8' }}>{myDeepData.totalRealCommits}</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-label">Automated/Fake</span>
                        <span className="stat-value" style={{ color: '#f87171' }}>{myDeepData.totalFakeCommits}</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-label">Repos Analyzed</span>
                        <span className="stat-value">{myDeepData.repoAnalysis.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Repository Commit Breakdown Table */}
                  <div className="chart-card-modern">
                    <h3>In-Depth Repository Commit Breakdown</h3>
                    <div className="repo-table-wrapper">
                      <table className="commit-table">
                        <thead>
                          <tr>
                            <th>Repository</th>
                            <th>Language</th>
                            <th>Real</th>
                            <th>Fake/Bot</th>
                            <th>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myDeepData.repoAnalysis.map((repo, idx) => (
                            <tr key={idx}>
                              <td className="repo-name-cell">📦 {repo.repoName}</td>
                              <td>{repo.language}</td>
                              <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{repo.realCommits}</td>
                              <td style={{ color: '#f87171' }}>{repo.fakeCommits}</td>
                              <td>
                                <span className="score-pill" style={{ background: repo.authenticityScore > 75 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)', color: repo.authenticityScore > 75 ? '#34d399' : '#f87171' }}>
                                  {repo.authenticityScore}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 3. Top Languages Distribution Pie Chart at Bottom */}
                  <div className="chart-card-modern">
                    <h3>Top Languages Distribution</h3>
                    <div className="chart-wrapper" style={{ height: '320px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={myLanguages} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {myLanguages.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="view-container">
              <h2>Search Developer Profile</h2>
              <p className="subtitle">Inspect any developer profile with deep commit authenticity metrics.</p>
              
              <form onSubmit={handleAuthSearchSubmit} className="search-box-wrapper">
                <input
                  type="text"
                  placeholder="Enter GitHub username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="modern-search-input"
                />
                <button type="submit" className="modern-search-btn">Inspect Profile</button>
              </form>

              {searchLoading && <div className="loader-container"><p>Analyzing target user commits...</p></div>}

              {searchedDeepData && (
                <div className="dashboard-stack" style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '20px' }}>
                  <div className="profile-card-modern">
                    <div className="profile-top">
                      <img src={searchedDeepData.profile.avatar_url} alt="Avatar" className="profile-avatar-lg" />
                      <div className="profile-meta">
                        <h2>{searchedDeepData.profile.name || searchedDeepData.profile.login}</h2>
                        <a href={searchedDeepData.profile.html_url} target="_blank" rel="noreferrer" className="username-link">
                          @{searchedDeepData.profile.login} ↗
                        </a>
                        <p className="profile-bio">{searchedDeepData.profile.bio || 'No public bio provided.'}</p>
                      </div>
                    </div>

                    <div className="stats-cards-grid">
                      <div className="stat-box">
                        <span className="stat-label">Authenticity Score</span>
                        <span className="stat-value" style={{ color: '#34d399' }}>{searchedDeepData.overallAuthenticityScore}%</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-label">Real Commits</span>
                        <span className="stat-value" style={{ color: '#38bdf8' }}>{searchedDeepData.totalRealCommits}</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-label">Automated/Fake</span>
                        <span className="stat-value" style={{ color: '#f87171' }}>{searchedDeepData.totalFakeCommits}</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-label">Repositories</span>
                        <span className="stat-value">{searchedDeepData.repoAnalysis.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="chart-card-modern">
                    <h3>Repository Commit Authenticity Breakdown</h3>
                    <div className="repo-table-wrapper">
                      <table className="commit-table">
                        <thead>
                          <tr>
                            <th>Repository</th>
                            <th>Language</th>
                            <th>Real</th>
                            <th>Fake/Bot</th>
                            <th>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchedDeepData.repoAnalysis.map((repo, idx) => (
                            <tr key={idx}>
                              <td className="repo-name-cell">📦 {repo.repoName}</td>
                              <td>{repo.language}</td>
                              <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{repo.realCommits}</td>
                              <td style={{ color: '#f87171' }}>{repo.fakeCommits}</td>
                              <td>
                                <span className="score-pill" style={{ background: repo.authenticityScore > 75 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)', color: repo.authenticityScore > 75 ? '#34d399' : '#f87171' }}>
                                  {repo.authenticityScore}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: RICH DEVELOPER COMPARISON VIEW */}
          {activeTab === 'compare' && (
            <div className="view-container">
              <h2>Developer Comparison Engine</h2>
              <p className="subtitle">Compare two GitHub profiles side-by-side across commit authenticity, fake commits, repos, and primary languages.</p>

              <form onSubmit={handleCompareSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder="Developer 1 (e.g., chaudharymanish6930)"
                  value={compareUser1}
                  onChange={(e) => setCompareUser1(e.target.value)}
                  style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px', color: '#fff', flex: 1, outline: 'none' }}
                />
                <input
                  type="text"
                  placeholder="Developer 2 (e.g., torvalds)"
                  value={compareUser2}
                  onChange={(e) => setCompareUser2(e.target.value)}
                  style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px', color: '#fff', flex: 1, outline: 'none' }}
                />
                <button type="submit" className="modern-search-btn">Compare Profiles</button>
              </form>

              {compareLoading && <div className="loader-container"><p>Running deep comparison analysis on both developers...</p></div>}

              {compareResult && (
                <div className="dashboard-stack" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Side-by-Side Rich Matrix */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    
                    {/* Developer 1 */}
                    <div className="profile-card-modern" style={{ textAlign: 'center' }}>
                      <img src={compareResult.user1.profile.avatar_url} alt="Avatar" className="profile-avatar-lg" style={{ margin: '0 auto 16px auto' }} />
                      <h3>{compareResult.user1.profile.name || compareResult.user1.profile.login}</h3>
                      <a href={compareResult.user1.profile.html_url} target="_blank" rel="noreferrer" className="username-link">@{compareResult.user1.profile.login} ↗</a>
                      
                      <div className="stats-cards-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '16px' }}>
                        <div className="stat-box">
                          <span className="stat-label">Authenticity</span>
                          <span className="stat-value" style={{ color: '#34d399' }}>{compareResult.user1.overallAuthenticityScore}%</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-label">Real Commits</span>
                          <span className="stat-value" style={{ color: '#38bdf8' }}>{compareResult.user1.totalRealCommits}</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-label">Automated/Fake</span>
                          <span className="stat-value" style={{ color: '#f87171' }}>{compareResult.user1.totalFakeCommits}</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-label">Top Language</span>
                          <span className="stat-value" style={{ fontSize: '1rem', color: '#fbbf24' }}>{compareResult.user1.primaryLanguage}</span>
                        </div>
                      </div>
                    </div>

                    {/* Developer 2 */}
                    <div className="profile-card-modern" style={{ textAlign: 'center' }}>
                      <img src={compareResult.user2.profile.avatar_url} alt="Avatar" className="profile-avatar-lg" style={{ margin: '0 auto 16px auto' }} />
                      <h3>{compareResult.user2.profile.name || compareResult.user2.profile.login}</h3>
                      <a href={compareResult.user2.profile.html_url} target="_blank" rel="noreferrer" className="username-link">@{compareResult.user2.profile.login} ↗</a>
                      
                      <div className="stats-cards-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '16px' }}>
                        <div className="stat-box">
                          <span className="stat-label">Authenticity</span>
                          <span className="stat-value" style={{ color: '#34d399' }}>{compareResult.user2.overallAuthenticityScore}%</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-label">Real Commits</span>
                          <span className="stat-value" style={{ color: '#38bdf8' }}>{compareResult.user2.totalRealCommits}</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-label">Automated/Fake</span>
                          <span className="stat-value" style={{ color: '#f87171' }}>{compareResult.user2.totalFakeCommits}</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-label">Top Language</span>
                          <span className="stat-value" style={{ fontSize: '1rem', color: '#fbbf24' }}>{compareResult.user2.primaryLanguage}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* AI Verdict Banner */}
                  <div className="chart-card-modern" style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(99, 102, 241, 0.1))', border: '1px solid #38bdf8' }}>
                    <h3 style={{ fontSize: '1.2rem', color: '#38bdf8', marginBottom: '8px' }}>🏆 Comparison Verdict</h3>
                    <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
                      {compareResult.winner}
                    </p>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;