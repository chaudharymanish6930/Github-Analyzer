import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiGitBranch, FiStar, FiUsers, FiTrendingUp, FiArrowRight, FiZap } from 'react-icons/fi';
import SearchBar from '../components/common/SearchBar';
import { analyticsService } from '../services/githubService';
import { formatNumber } from '../utils/helpers';

const FEATURE_CARDS = [
  { icon: FiUsers, title: 'Profile Analysis', desc: 'Deep-dive into any GitHub profile — followers, repos, bio, and more.', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20', iconColor: 'text-blue-500' },
  { icon: FiStar, title: 'Repository Analytics', desc: 'Stars, forks, languages, open issues — all in one beautiful view.', color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20', iconColor: 'text-yellow-500' },
  { icon: FiTrendingUp, title: 'Data Visualizations', desc: 'Interactive charts for language distribution, growth trends, and more.', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20', iconColor: 'text-purple-500' },
  { icon: FiGitBranch, title: 'Profile Comparison', desc: 'Compare two developers side-by-side with radar charts and metrics.', color: 'from-green-500/20 to-green-600/10 border-green-500/20', iconColor: 'text-green-500' }
];

const EXAMPLE_USERS = ['torvalds', 'gaearon', 'sindresorhus', 'yyx990803', 'tj', 'addyosmani'];

export default function HomePage() {
  const navigate = useNavigate();
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    analyticsService.getPopular()
      .then(r => setPopular(r.data.data || []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-brand-400/30 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 badge bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 mb-6 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
          >
            <FiZap size={12} /> GitHub Intelligence Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6"
          >
            Analyze Any{' '}
            <span className="text-gradient">GitHub Profile</span>
            {' '}Instantly
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Unlock deep insights into repositories, contributions, languages, and developer growth trends — all powered by the GitHub API.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <SearchBar size="large" placeholder="Search any GitHub username..." />
          </motion.div>

          {/* Quick examples */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex flex-wrap justify-center gap-2"
          >
            <span className="text-xs text-[var(--text-muted)] self-center">Try:</span>
            {EXAMPLE_USERS.map(user => (
              <button
                key={user}
                onClick={() => navigate(`/user/${user}`)}
                className="text-xs px-3 py-1.5 glass rounded-full text-[var(--text-secondary)] hover:text-brand-500 hover:border-brand-400/30 transition-all duration-200"
              >
                {user}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-20 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-3">
            Everything you need to understand a developer
          </h2>
          <p className="text-[var(--text-secondary)]">Comprehensive analytics in a single, beautiful dashboard.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURE_CARDS.map(({ icon: Icon, title, desc, color, iconColor }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`glass-card p-6 bg-gradient-to-br border ${color} hover:scale-[1.02] transition-all duration-200`}
            >
              <div className={`w-10 h-10 rounded-xl glass flex items-center justify-center mb-4 ${iconColor}`}>
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Popular profiles */}
      {popular.length > 0 && (
        <section className="px-4 pb-24 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              🔥 Most Searched Profiles
            </h2>
            <button
              onClick={() => navigate('/search')}
              className="btn-ghost text-sm"
            >
              View all <FiArrowRight size={14} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {popular.slice(0, 10).map((item, i) => (
              <motion.button
                key={item.username}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/user/${item.username}`)}
                className="glass-card p-4 text-center hover:border-brand-400/30 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
              >
                <img
                  src={item.profile?.avatar_url}
                  alt={item.username}
                  className="w-12 h-12 rounded-xl mx-auto mb-3 object-cover border border-[var(--border-color)]"
                />
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.profile?.name || item.username}</p>
                <p className="text-xs text-[var(--text-muted)] font-mono">@{item.username}</p>
                <div className="flex justify-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                  <span>⭐ {formatNumber(item.analytics?.totalStars || 0)}</span>
                  <span>👥 {formatNumber(item.profile?.followers || 0)}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
