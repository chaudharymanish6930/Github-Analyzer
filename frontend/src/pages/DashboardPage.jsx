import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiGrid, FiClock, FiHeart, FiTrash2, FiExternalLink, FiGitBranch, FiStar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/githubService';
import { formatNumber, timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleClearHistory = async () => {
    if (!confirm('Clear all search history and recently viewed?')) return;
    try {
      await userService.clearHistory();
      updateUser({ searchHistory: [], recentlyViewed: [] });
      toast.success('History cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  const handleRemoveFavorite = async (repoId, repoName) => {
    try {
      const res = await userService.removeFavorite(repoId);
      updateUser({ favoriteRepos: res.data.favoriteRepos });
      toast.success(`Removed ${repoName} from favorites`);
    } catch {
      toast.error('Failed to remove favorite');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={user?.avatar} alt={user?.username} className="w-14 h-14 rounded-2xl border-2 border-[var(--border-color)] object-cover" />
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              Welcome back, {user?.name?.split(' ')[0] || user?.username}!
            </h1>
            <p className="text-[var(--text-muted)] text-sm font-mono">@{user?.username}</p>
          </div>
        </div>
        <button onClick={() => navigate(`/user/${user?.username}`)} className="btn-primary">
          <FiGitBranch size={15} /> View My Profile
        </button>
      </motion.div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Searches Made', value: user?.searchHistory?.length || 0, icon: '🔍' },
          { label: 'Profiles Viewed', value: user?.recentlyViewed?.length || 0, icon: '👁️' },
          { label: 'Saved Repos', value: user?.favoriteRepos?.length || 0, icon: '❤️' },
          { label: 'My Repos', value: user?.githubProfile?.publicRepos || 0, icon: '📦' }
        ].map(({ label, value, icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="stat-card text-center"
          >
            <span className="text-2xl mb-1">{icon}</span>
            <p className="font-display text-3xl font-bold text-[var(--text-primary)]">{value}</p>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent searches */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title flex items-center gap-2">
              <FiClock size={18} className="text-brand-500" /> Recent Searches
            </h2>
            {user?.searchHistory?.length > 0 && (
              <button onClick={handleClearHistory} className="text-xs text-red-400 hover:text-red-500 transition-colors flex items-center gap-1">
                <FiTrash2 size={12} /> Clear
              </button>
            )}
          </div>
          {user?.searchHistory?.length > 0 ? (
            <div className="space-y-2">
              {user.searchHistory.slice(0, 10).map((h, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/user/${h.username}`)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors group text-left"
                >
                  <span className="text-sm font-medium text-[var(--text-primary)] font-mono">@{h.username}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">{timeAgo(h.searchedAt)}</span>
                    <FiExternalLink size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              No searches yet. Start exploring GitHub profiles!
            </div>
          )}
        </motion.div>

        {/* Favorite repos */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title flex items-center gap-2">
              <FiHeart size={18} className="text-red-500" /> Favorite Repos
            </h2>
            <button onClick={() => navigate('/favorites')} className="text-xs text-brand-500 hover:text-brand-600 font-medium">
              View all →
            </button>
          </div>
          {user?.favoriteRepos?.length > 0 ? (
            <div className="space-y-2">
              {user.favoriteRepos.slice(0, 8).map((repo, i) => (
                <div key={repo.repoId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{repo.fullName || `${repo.owner}/${repo.name}`}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {repo.language && <span className="text-xs text-[var(--text-muted)]">{repo.language}</span>}
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-0.5">
                        <FiStar size={10} className="text-yellow-500" /> {formatNumber(repo.stars)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFavorite(repo.repoId, repo.name)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 rounded-lg"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              No favorites yet. Heart a repository to save it here!
            </div>
          )}
        </motion.div>
      </div>

      {/* Recently Viewed profiles */}
      {user?.recentlyViewed?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h2 className="section-title mb-5 flex items-center gap-2">
            <FiGrid size={18} className="text-brand-500" /> Recently Viewed Profiles
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {user.recentlyViewed.map((v, i) => (
              <motion.button
                key={v.username}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={() => navigate(`/user/${v.username}`)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all hover:scale-105"
              >
                <img src={v.avatar} alt={v.username} className="w-12 h-12 rounded-xl object-cover border border-[var(--border-color)]" />
                <div className="text-center">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[80px]">{v.name || v.username}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">@{v.username}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
