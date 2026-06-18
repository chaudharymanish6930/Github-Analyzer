import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiUser, FiClock, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { githubService, analyticsService } from '../services/githubService';
import { useEffect } from 'react';

function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popular, setPopular] = useState([]);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    analyticsService.getPopular()
      .then(r => setPopular(r.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }
    setLoading(true);
    githubService.searchUsers(debouncedQuery)
      .then(r => { setResults(r.data.data.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debouncedQuery]);

  const handleSelect = (username) => navigate(`/user/${username}`);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold text-[var(--text-primary)] mb-3">
          Search GitHub Users
        </h1>
        <p className="text-[var(--text-muted)]">Find and analyze any GitHub profile</p>
      </motion.div>

      {/* Search input */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mb-8">
        <div className="relative glass rounded-2xl focus-within:ring-2 focus-within:ring-brand-400/40 transition-all">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-lg" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a GitHub username..."
            autoFocus
            className="w-full pl-12 pr-4 py-4 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none text-base font-medium"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Dropdown results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 right-0 mt-2 glass-card overflow-hidden z-40 max-h-96 overflow-y-auto"
            >
              {results.map((user, i) => (
                <motion.button
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleSelect(user.login)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors text-left border-b border-[var(--border-color)] last:border-0"
                >
                  <img src={user.avatar_url} alt={user.login} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] text-sm">{user.login}</p>
                    <p className="text-xs text-[var(--text-muted)] font-mono capitalize">{user.type}</p>
                  </div>
                  <FiSearch size={14} className="ml-auto text-[var(--text-muted)]" />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Recently viewed */}
      {isAuthenticated && user?.recentlyViewed?.length > 0 && !query && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4 text-sm text-[var(--text-muted)] font-medium">
            <FiClock size={14} /> Recently Viewed
          </div>
          <div className="flex flex-wrap gap-3">
            {user.recentlyViewed.map(v => (
              <button
                key={v.username}
                onClick={() => handleSelect(v.username)}
                className="flex items-center gap-2.5 glass px-3 py-2 rounded-xl hover:border-brand-400/30 transition-all text-sm"
              >
                <img src={v.avatar} alt={v.username} className="w-6 h-6 rounded-full" />
                <span className="text-[var(--text-primary)] font-medium">{v.username}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Popular profiles */}
      {popular.length > 0 && !query && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-4 text-sm text-[var(--text-muted)] font-medium">
            <FiTrendingUp size={14} /> Popular on GitAnalyzer
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {popular.slice(0, 6).map((item, i) => (
              <motion.button
                key={item.username}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={() => handleSelect(item.username)}
                className="flex items-center gap-3 glass-card p-3.5 hover:border-brand-400/30 hover:scale-[1.01] transition-all text-left"
              >
                <img src={item.profile?.avatar_url} alt={item.username} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{item.profile?.name || item.username}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono">@{item.username}</p>
                </div>
                <div className="text-right text-xs text-[var(--text-muted)] shrink-0">
                  <div>⭐ {item.analytics?.totalStars || 0}</div>
                  <div>🔍 {item.searchCount}x</div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
