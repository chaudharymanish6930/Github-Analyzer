import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import './App.css';

// Local dev talks to the Express server directly.
// In production the Vercel rewrite (vercel.json) proxies /api and /auth to Render.
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

const LANG_COLORS = ['#5A4BFF', '#0B9A72', '#E8A317', '#DC4348', '#2D9CDB', '#B455D6', '#7A8299'];
const EXAMPLE_USERS = ['torvalds', 'gaearon', 'sindresorhus'];
const TAB_TITLES = {
  dashboard: 'Your dashboard',
  search: 'Inspect a developer',
  compare: 'Compare developers'
};

// Chart colors are passed as plain values (SVG props), so they are themed here
const CHART = {
  light: { grid: '#E4E8F2', tick: '#5C6584', tipBg: '#FFFFFF', tipBorder: '#DCE1EE', tipText: '#1C2340', cursor: 'rgba(90,75,255,0.06)', real: '#0B9A72', bot: '#DC4348' },
  dark: { grid: '#252D52', tick: '#9AA3C7', tipBg: '#1B2245', tipBorder: '#2E3763', tipText: '#E6E9F7', cursor: 'rgba(138,128,255,0.12)', real: '#18B889', bot: '#F0585D' }
};

const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

const cleanName = (value) => value.trim().toLowerCase();

const getErrorMessage = (err) => {
  const status = err.response?.status;
  if (status === 404) return 'We could not find that GitHub user. Check the spelling and try again.';
  if (status === 429) return 'GitHub rate limit reached. Please try again in a few minutes.';
  if (!err.response) return 'Could not reach the server. It may be waking up, so try again in a moment.';
  return 'Something went wrong while loading this profile. Please try again.';
};

const getTopLanguage = (langObj) => {
  if (!langObj || Object.keys(langObj).length === 0) return 'N/A';
  return Object.keys(langObj).reduce((a, b) => (langObj[a] > langObj[b] ? a : b));
};

const getVerdict = (score, total) => {
  if (total === 0) return { tone: 'muted', title: 'Not enough data', text: 'No recent public commits were found to score.' };
  if (score >= 85) return { tone: 'real', title: 'Looks like consistent real work', text: 'Almost every recent commit reads like genuine development.' };
  if (score >= 60) return { tone: 'amber', title: 'Mostly real, with some noise', text: 'A fair share of recent commits use generic or automated messages.' };
  return { tone: 'bot', title: 'Many commits look automated', text: 'A large share of recent commits are bot-made or use placeholder messages.' };
};

/* ---------- Safe storage + URL helpers ---------- */

const storage = {
  get(store, key) {
    try { return window[store].getItem(key); } catch { return null; }
  },
  set(store, key, value) {
    try { window[store].setItem(key, value); } catch { /* storage unavailable */ }
  },
  remove(store, key) {
    try { window[store].removeItem(key); } catch { /* storage unavailable */ }
  }
};

const readSharedUser = () => {
  const fromUrl = new URLSearchParams(window.location.search).get('u');
  if (fromUrl && USERNAME_PATTERN.test(fromUrl)) return fromUrl.toLowerCase();
  const pending = storage.get('sessionStorage', 'gp-pending-user');
  if (pending && USERNAME_PATTERN.test(pending)) return pending.toLowerCase();
  return null;
};

const setUrlUser = (name) => {
  const url = new URL(window.location.href);
  if (name) url.searchParams.set('u', name);
  else url.searchParams.delete('u');
  window.history.replaceState({}, '', url);
};

/* ---------- Theme ---------- */

const getInitialTheme = () => {
  const saved = storage.get('localStorage', 'gp-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    storage.set('localStorage', 'gp-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0A0E1D' : '#F1F3F9');
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return [theme, toggle];
}

/* ---------- Small presentational pieces ---------- */

const ICONS = {
  home: 'M4 11l8-7 8 7v9H4z',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
  compare: 'M8 4v16M16 4v16M4 8l4-4 4 4M12 16l4 4 4-4',
  logout: 'M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l5-5-5-5M15 12H4',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4',
  moon: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
  share: 'M12 15V3M8 7l4-4 4 4M5 13v6a2 2 0 002 2h14a2 2 0 002-2v-6'
};

function Icon({ name }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function Logo({ onDark }) {
  return (
    <div className={`logo ${onDark ? 'logo-on-dark' : ''}`}>
      <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
        <rect width="28" height="28" rx="8" fill="#5A4BFF" />
        <path d="M4 15h5l2.5-6 4 11 2.5-5H24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>GitPulse</span>
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button type="button" className="icon-btn" onClick={onToggle} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}

function PulseLine() {
  return (
    <svg className="pulse" viewBox="0 0 600 120" aria-hidden="true" focusable="false">
      <path
        className="pulse-path"
        pathLength="1"
        d="M0 70H120L150 70L170 25L200 105L225 50L245 70H400L425 70L445 30L475 95L495 70H600"
      />
      <circle className="pulse-dot" cx="170" cy="25" r="5" fill="#8F85FF" />
      <circle className="pulse-dot" cx="200" cy="105" r="5" fill="#FF6B70" style={{ animationDelay: '1.9s' }} />
      <circle className="pulse-dot" cx="445" cy="30" r="5" fill="#8F85FF" style={{ animationDelay: '2.1s' }} />
      <circle className="pulse-dot" cx="475" cy="95" r="5" fill="#3DD6A3" style={{ animationDelay: '2.3s' }} />
    </svg>
  );
}

function Notice({ type = 'error', children }) {
  return (
    <div className={`notice notice-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

function Loading({ children }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function Tile({ label, value, tone }) {
  return (
    <div className={`tile ${tone ? `tile-${tone}` : ''}`}>
      <span className="tile-label">{label}</span>
      <span className="tile-value">{value}</span>
    </div>
  );
}

function Gauge({ value, small }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const tone = value >= 75 ? 'var(--real)' : value >= 50 ? 'var(--amber)' : 'var(--bot)';

  return (
    <div className={`gauge ${small ? 'gauge-sm' : ''}`} role="img" aria-label={`Authenticity score ${value} percent`}>
      <svg viewBox="0 0 120 120">
        <circle className="gauge-track" cx="60" cy="60" r={radius} />
        <circle
          className="gauge-fill"
          cx="60"
          cy="60"
          r={radius}
          style={{ stroke: tone }}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="gauge-text">
        <strong>{value}%</strong>
        <span>authentic</span>
      </div>
    </div>
  );
}

function SampleCard() {
  return (
    <aside className="sample" aria-hidden="true">
      <span className="sample-badge">Sample report</span>
      <div className="sample-body">
        <Gauge value={92} small />
        <ul>
          <li><i style={{ background: '#3DD6A3' }} />Authentic<b>184</b></li>
          <li><i style={{ background: '#FF6B70' }} />Automated<b>16</b></li>
          <li><i style={{ background: '#8F85FF' }} />Repositories<b>23</b></li>
        </ul>
      </div>
      <div className="sample-repos">
        {[['api-gateway', 96], ['design-system', 88], ['dotfiles', 61]].map(([name, pct]) => (
          <div key={name} className="sample-repo">
            <span>{name}</span>
            <span className="sample-track"><span style={{ width: `${pct}%`, background: pct > 75 ? '#3DD6A3' : '#FF6B70' }} /></span>
            <b>{pct}%</b>
          </div>
        ))}
      </div>
    </aside>
  );
}

function Identity({ profile, fallbackBio, onShare }) {
  return (
    <div className="identity">
      <img src={profile.avatar_url} alt={`${profile.login} avatar`} className="avatar" />
      <div className="identity-text">
        <h2>{profile.name || profile.login}</h2>
        <a href={profile.html_url} target="_blank" rel="noreferrer" className="handle">
          @{profile.login}
        </a>
        <p className="bio">{profile.bio || fallbackBio}</p>
        {onShare && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onShare}>
            <Icon name="share" />
            Share report
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Full commit-authenticity report ---------- */

function DeepReport({ data, theme, onShare, fallbackBio = 'No public bio provided.' }) {
  const c = CHART[theme];
  const verdict = getVerdict(data.overallAuthenticityScore, data.grandTotalCommits ?? (data.totalRealCommits + data.totalFakeCommits));

  const languages = Object.entries(data.languages || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const topRepos = [...data.repoAnalysis]
    .sort((a, b) => b.totalInspectedCommits - a.totalInspectedCommits)
    .slice(0, 8)
    .map((r) => ({ name: r.repoName, Authentic: r.realCommits, Automated: r.fakeCommits }));

  const tooltipStyle = { borderRadius: 12, border: `1px solid ${c.tipBorder}`, background: c.tipBg, color: c.tipText, fontSize: 13 };

  return (
    <div className="report">
      <section className="card profile-card">
        <Identity profile={data.profile} fallbackBio={fallbackBio} onShare={onShare} />
        <Gauge value={data.overallAuthenticityScore} />
        <div className={`insight insight-${verdict.tone}`}>
          <strong>{verdict.title}</strong>
          <span>{verdict.text}</span>
        </div>
        <div className="tiles">
          <Tile label="Authentic commits" value={data.totalRealCommits} tone="real" />
          <Tile label="Automated commits" value={data.totalFakeCommits} tone="bot" />
          <Tile label="Repositories analyzed" value={data.repoAnalysis.length} />
          <Tile label="Top language" value={getTopLanguage(data.languages)} />
        </div>
        <p className="footnote">Based on the 20 most recent commits in each public repository.</p>
      </section>

      {data.repoAnalysis.length === 0 ? (
        <section className="card empty">
          <h3>No commits to analyze yet</h3>
          <p>This account has no public repositories with commit history.</p>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="card-head">
              <h3>Most active repositories</h3>
              <div className="legend">
                <span><i style={{ background: c.real }} />Authentic</span>
                <span><i style={{ background: c.bot }} />Automated</span>
              </div>
            </div>
            <div className="chart" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRepos} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                  <CartesianGrid stroke={c.grid} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: c.tick, fontSize: 12 }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: c.tick, fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: c.cursor }} contentStyle={tooltipStyle} labelStyle={{ color: c.tipText }} />
                  <Bar dataKey="Authentic" stackId="c" fill={c.real} />
                  <Bar dataKey="Automated" stackId="c" fill={c.bot} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card">
            <h3>Repository breakdown</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Repository</th>
                    <th scope="col">Language</th>
                    <th scope="col" className="num">Authentic</th>
                    <th scope="col" className="num">Automated</th>
                    <th scope="col">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.repoAnalysis.map((repo) => {
                    const good = repo.authenticityScore > 75;
                    return (
                      <tr key={repo.repoName}>
                        <td className="repo-cell">{repo.repoName}</td>
                        <td>{repo.language}</td>
                        <td className="num real">{repo.realCommits}</td>
                        <td className="num bot">{repo.fakeCommits}</td>
                        <td>
                          <div className="meter" title={`${repo.authenticityScore}%`}>
                            <span className="meter-track">
                              <span
                                className="meter-fill"
                                style={{ width: `${repo.authenticityScore}%`, background: good ? 'var(--real)' : 'var(--bot)' }}
                              />
                            </span>
                            <span className="meter-num">{repo.authenticityScore}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {languages.length > 0 && (
            <section className="card">
              <h3>Languages</h3>
              <div className="lang-layout">
                <div className="chart" style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={languages} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={100} paddingAngle={2} stroke="none">
                        {languages.map((entry, index) => (
                          <Cell key={entry.name} fill={LANG_COLORS[index % LANG_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: c.tipText }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="lang-list">
                  {languages.slice(0, 7).map((lang, index) => (
                    <li key={lang.name}>
                      <i style={{ background: LANG_COLORS[index % LANG_COLORS.length] }} />
                      <span>{lang.name}</span>
                      <b>{lang.value} {lang.value === 1 ? 'repo' : 'repos'}</b>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function CompareCard({ data, isWinner }) {
  return (
    <article className={`card compare-card ${isWinner ? 'is-winner' : ''}`}>
      {isWinner && <span className="badge">Higher score</span>}
      <img src={data.profile.avatar_url} alt={`${data.profile.login} avatar`} className="avatar avatar-lg" />
      <h3>{data.profile.name || data.profile.login}</h3>
      <a href={data.profile.html_url} target="_blank" rel="noreferrer" className="handle">@{data.profile.login}</a>
      <div className="tiles tiles-2">
        <Tile label="Authenticity" value={`${data.overallAuthenticityScore}%`} tone="real" />
        <Tile label="Authentic commits" value={data.totalRealCommits} />
        <Tile label="Automated commits" value={data.totalFakeCommits} tone="bot" />
        <Tile label="Top language" value={data.primaryLanguage} />
      </div>
    </article>
  );
}

function HowItWorks() {
  const steps = [
    { title: 'Search a username', text: 'See repositories, stars and followers for any public profile, no account needed.' },
    { title: 'Sign in with GitHub', text: 'Sign in once to unlock commit analysis for any developer.' },
    { title: 'Read and share the report', text: 'Get an authenticity score, a repository breakdown and a link you can send to anyone.' }
  ];
  return (
    <section className="how" aria-labelledby="how-title">
      <h2 id="how-title">How GitPulse works</h2>
      <ol className="steps">
        {steps.map((step, i) => (
          <li key={step.title} className="card step">
            <span className="step-num">{i + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
      <details className="card method">
        <summary>How is the authenticity score calculated?</summary>
        <p>
          For each public repository the developer owns (forks are skipped), GitPulse looks at the 20 most recent commits they authored.
          A commit is counted as automated when it comes from a bot account, mentions auto-commit or automation in its message, or uses a placeholder message such as "update", "test" or "fix".
          The score is the share of commits that were not flagged.
        </p>
        <p>
          This is a quick signal, not proof. Short commit messages are not always a bad sign, so read the score alongside the repositories themselves.
        </p>
      </details>
    </section>
  );
}

/* ---------- App ---------- */

function App() {
  const [theme, toggleTheme] = useTheme();

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginNotice, setLoginNotice] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Logged-in user's own deep analysis
  const [myDeepData, setMyDeepData] = useState(null);
  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState('');

  // Search (shared input between guest + logged-in search)
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Guest: basic profile
  const [guestProfile, setGuestProfile] = useState(null);
  const [guestLoading, setGuestLoading] = useState(false);

  // Logged-in: deep analytics for a searched user
  const [searchedDeepData, setSearchedDeepData] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Compare
  const [compareUser1, setCompareUser1] = useState('');
  const [compareUser2, setCompareUser2] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState('');

  // Toast
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  // A profile to open on load: from a shared link (?u=name) or saved before signing in
  const [initialTarget] = useState(readSharedUser);
  const booted = useRef(false);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }, []);

  const fetchDeepAnalysis = useCallback(async (username) => {
    const response = await axios.get(
      `${API_BASE_URL}/api/github/${encodeURIComponent(cleanName(username))}/deep-analysis`
    );
    return response.data.data;
  }, []);

  // Show a message if GitHub sign-in failed (server redirects with ?login=failed)
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('login') === 'failed') {
      setLoginNotice('GitHub sign-in did not complete. Please try again.');
      url.searchParams.delete('login');
      window.history.replaceState({}, '', url);
    }
  }, []);

  // Check logged-in user on mount
  useEffect(() => {
    let active = true;

    axios.get(`${API_BASE_URL}/api/current-user`, { withCredentials: true, timeout: 60000 })
      .then(async (res) => {
        if (!active || !res.data.success || !res.data.user) return;
        const loggedInUser = res.data.user;
        setUser(loggedInUser);
        setAuthChecked(true);
        setMyLoading(true);
        try {
          const data = await fetchDeepAnalysis(loggedInUser.username);
          if (active) setMyDeepData(data);
        } catch (err) {
          if (active) setMyError(getErrorMessage(err));
        } finally {
          if (active) setMyLoading(false);
        }
      })
      .catch(() => { /* guest mode */ })
      .finally(() => { if (active) setAuthChecked(true); });

    return () => { active = false; };
  }, [fetchDeepAnalysis]);

  const handleLogin = (target) => {
    // Remember which profile the visitor was looking at, so we can reopen it after sign-in
    if (typeof target === 'string' && target) {
      storage.set('sessionStorage', 'gp-pending-user', cleanName(target));
    }
    window.location.href = `${API_BASE_URL}/auth/github`;
  };

  const handleLogout = () => {
    window.location.href = `${API_BASE_URL}/auth/logout`;
  };

  const runGuestSearch = async (name) => {
    const query = cleanName(name);
    if (!query) return;

    setGuestLoading(true);
    setError('');
    setGuestProfile(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/github/${encodeURIComponent(query)}`);
      setGuestProfile(response.data.data);
      setUrlUser(response.data.data.login.toLowerCase());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGuestLoading(false);
    }
  };

  const runDeepSearch = async (name) => {
    if (!name.trim()) return;

    setError('');
    setSearchedDeepData(null);
    setSearchLoading(true);
    try {
      const data = await fetchDeepAnalysis(name);
      setSearchedDeepData(data);
      setUrlUser(data.profile.login.toLowerCase());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSearchLoading(false);
    }
  };

  // Open a shared / pending profile once we know whether the visitor is signed in
  useEffect(() => {
    if (!authChecked || booted.current) return;
    booted.current = true;
    if (!initialTarget) return;
    storage.remove('sessionStorage', 'gp-pending-user');
    setSearchQuery(initialTarget);
    if (user) {
      setActiveTab('search');
      runDeepSearch(initialTarget);
    } else {
      runGuestSearch(initialTarget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, user]);

  const changeTab = (id) => {
    setActiveTab(id);
    if (id === 'search' && searchedDeepData) setUrlUser(searchedDeepData.profile.login.toLowerCase());
    else setUrlUser(null);
  };

  const shareReport = async (username) => {
    const url = `${window.location.origin}/?u=${encodeURIComponent(username.toLowerCase())}`;
    const isMobile = /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent);

    if (navigator.share && isMobile) {
      try {
        await navigator.share({ title: `${username} on GitPulse`, text: `Commit report for @${username}`, url });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied');
    } catch {
      window.prompt('Copy this link', url);
    }
  };

  const handleGuestSearchSubmit = (e) => {
    e.preventDefault();
    runGuestSearch(searchQuery);
  };

  const handleAuthSearchSubmit = (e) => {
    e.preventDefault();
    runDeepSearch(searchQuery);
  };

  const handleCompareSubmit = async (e) => {
    e.preventDefault();
    if (!compareUser1.trim() || !compareUser2.trim()) return;

    setCompareLoading(true);
    setCompareResult(null);
    setCompareError('');

    try {
      const [u1, u2] = await Promise.all([
        fetchDeepAnalysis(compareUser1),
        fetchDeepAnalysis(compareUser2)
      ]);

      u1.primaryLanguage = getTopLanguage(u1.languages);
      u2.primaryLanguage = getTopLanguage(u2.languages);

      // Weighted score: authenticity percentage plus volume of authentic commits
      const score1 = (u1.totalRealCommits > 0 ? u1.overallAuthenticityScore : 0) + (u1.totalRealCommits * 0.5);
      const score2 = (u2.totalRealCommits > 0 ? u2.overallAuthenticityScore : 0) + (u2.totalRealCommits * 0.5);

      let winner = 'tie';
      let verdict = 'Both profiles score the same.';
      if (score1 > score2) {
        winner = 'user1';
        verdict = `@${u1.profile.login} leads with ${u1.totalRealCommits} authentic commits and a ${u1.overallAuthenticityScore}% authenticity score.`;
      } else if (score2 > score1) {
        winner = 'user2';
        verdict = `@${u2.profile.login} leads with ${u2.totalRealCommits} authentic commits and a ${u2.overallAuthenticityScore}% authenticity score.`;
      }

      setCompareResult({ user1: u1, user2: u2, winner, verdict });
    } catch (err) {
      setCompareError(getErrorMessage(err));
    } finally {
      setCompareLoading(false);
    }
  };

  const toastNode = (
    <div className="toast-region" aria-live="polite">
      {toast && <div className="toast">{toast}</div>}
    </div>
  );

  /* ----- Splash while checking session ----- */
  if (!authChecked) {
    return (
      <div className="splash">
        <Logo />
        <Loading>Connecting to GitPulse. The server can take up to a minute to wake up.</Loading>
      </div>
    );
  }

  /* ----- Guest view ----- */
  if (!user) {
    return (
      <div className="site">
        <header className="topbar">
          <Logo />
          <div className="topbar-actions">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <button onClick={() => handleLogin(guestProfile?.login)} className="btn btn-ghost">
              <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
              <span className="btn-label">Sign in with GitHub</span>
            </button>
          </div>
        </header>

        <main>
          <section className="hero">
            <div className="hero-copy">
              <h1>See the work behind a GitHub profile</h1>
              <p className="hero-sub">
                Look up any developer to see their repositories, stars and languages. Sign in to check how many of their commits are real work and how many are automated.
              </p>

              <form onSubmit={handleGuestSearchSubmit} className="search">
                <label htmlFor="guest-search" className="sr-only">GitHub username</label>
                <input
                  id="guest-search"
                  type="text"
                  placeholder="GitHub username, for example torvalds"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                <button type="submit" className="btn btn-primary" disabled={guestLoading}>
                  {guestLoading ? 'Searching' : 'Search'}
                </button>
              </form>

              <div className="examples">
                <span>Try</span>
                {EXAMPLE_USERS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="chip"
                    onClick={() => { setSearchQuery(name); runGuestSearch(name); }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <SampleCard />
            <PulseLine />
          </section>

          {loginNotice && <Notice type="info">{loginNotice}</Notice>}
          {guestLoading && <Loading>Fetching profile</Loading>}
          {error && <Notice>{error}</Notice>}

          {guestProfile && (
            <section className="report">
              <div className="card profile-card profile-card-basic">
                <Identity
                  profile={guestProfile}
                  fallbackBio="No public bio provided."
                  onShare={() => shareReport(guestProfile.login)}
                />
                <div className="tiles">
                  <Tile label="Repositories" value={guestProfile.public_repos} />
                  <Tile label="Followers" value={guestProfile.followers} />
                  <Tile label="Following" value={guestProfile.following} />
                  <Tile label="Total stars" value={guestProfile.totalStars || 0} />
                </div>
              </div>

              <div className="card unlock">
                <div>
                  <h3>See how many of @{guestProfile.login}'s commits are real</h3>
                  <p>Sign in to get an authenticity score, a repository breakdown and language mix for this developer.</p>
                </div>
                <button onClick={() => handleLogin(guestProfile.login)} className="btn btn-primary">Sign in to unlock</button>
              </div>
            </section>
          )}

          <HowItWorks />
        </main>

        <footer className="footer">GitPulse reads public GitHub data only and is not affiliated with GitHub.</footer>
        {toastNode}
      </div>
    );
  }

  /* ----- Logged-in dashboard ----- */
  const displayName = user.displayName || user.username;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'search', label: 'Inspect', icon: 'search' },
    { id: 'compare', label: 'Compare', icon: 'compare' }
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <Logo onDark />
        <nav className="nav" aria-label="Main">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => changeTab(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
          <button className="nav-item nav-logout" onClick={handleLogout}>
            <Icon name="logout" />
            <span>Sign out</span>
          </button>
        </nav>
      </aside>

      <main className="main">
        <header className="main-head">
          <h1>{TAB_TITLES[activeTab]}</h1>
          <div className="head-actions">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <div className="user-pill">
              <img src={user.avatarUrl} alt="" />
              <span>{displayName}</span>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="view">
            <p className="lede">Hi {displayName}. Here is how your own commit history looks.</p>
            {myLoading && <Loading>Analyzing your repositories. This can take a few seconds.</Loading>}
            {myError && <Notice>{myError}</Notice>}
            {myDeepData && (
              <DeepReport
                data={myDeepData}
                theme={theme}
                fallbackBio="Developer on GitHub"
                onShare={() => shareReport(myDeepData.profile.login)}
              />
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="view">
            <p className="lede">Enter a GitHub username to see their commit authenticity report.</p>
            <form onSubmit={handleAuthSearchSubmit} className="search search-light">
              <label htmlFor="auth-search" className="sr-only">GitHub username</label>
              <input
                id="auth-search"
                type="text"
                placeholder="GitHub username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <button type="submit" className="btn btn-primary" disabled={searchLoading}>
                {searchLoading ? 'Analyzing' : 'Analyze profile'}
              </button>
            </form>

            {searchLoading && <Loading>Analyzing commits for this developer</Loading>}
            {error && <Notice>{error}</Notice>}
            {searchedDeepData && (
              <DeepReport
                data={searchedDeepData}
                theme={theme}
                onShare={() => shareReport(searchedDeepData.profile.login)}
              />
            )}
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="view">
            <p className="lede">Put two developers side by side on authenticity, commit volume and languages.</p>

            <form onSubmit={handleCompareSubmit} className="compare-form">
              <div>
                <label htmlFor="cmp1" className="sr-only">First developer</label>
                <input id="cmp1" type="text" placeholder="First username" value={compareUser1} onChange={(e) => setCompareUser1(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck="false" />
              </div>
              <div>
                <label htmlFor="cmp2" className="sr-only">Second developer</label>
                <input id="cmp2" type="text" placeholder="Second username" value={compareUser2} onChange={(e) => setCompareUser2(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck="false" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={compareLoading}>
                {compareLoading ? 'Comparing' : 'Compare'}
              </button>
            </form>

            {compareLoading && <Loading>Analyzing both developers</Loading>}
            {compareError && <Notice>{compareError}</Notice>}

            {compareResult && (
              <div className="report">
                <div className="vs-grid">
                  <CompareCard data={compareResult.user1} isWinner={compareResult.winner === 'user1'} />
                  <CompareCard data={compareResult.user2} isWinner={compareResult.winner === 'user2'} />
                </div>
                <section className="card verdict">
                  <h3>Verdict</h3>
                  <p>{compareResult.verdict}</p>
                </section>
              </div>
            )}
          </div>
        )}
      </main>
      {toastNode}
    </div>
  );
}

export default App;
