import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiStar, FiTrash2, FiExternalLink, FiGitBranch } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/githubService';
import { formatNumber, getLanguageColor } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function FavoritesPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const favorites = user?.favoriteRepos || [];

  const handleRemove = async (repoId, repoName) => {
    try {
      const res = await userService.removeFavorite(repoId);
      updateUser({ favoriteRepos: res.data.favoriteRepos });
      toast.success(`Removed ${repoName}`);
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <FiHeart className="text-red-500" /> Favorite Repositories
          </h1>
          <p className="text-[var(--text-muted)] mt-1 text-sm">{favorites.length} saved repositories</p>
        </div>
      </motion.div>

      {favorites.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {favorites.map((repo, i) => (
            <motion.div
              key={repo.repoId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card p-5 group hover:border-brand-400/30 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <a
                    href={`https://github.com/${repo.fullName || `${repo.owner}/${repo.name}`}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[var(--text-primary)] hover:text-brand-500 transition-colors text-sm flex items-center gap-1.5 group/link"
                  >
                    {repo.fullName || `${repo.owner}/${repo.name}`}
                    <FiExternalLink size={11} className="opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                  </a>
                  {repo.description && (
                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">{repo.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(repo.repoId, repo.name)}
                  className="p-1.5 text-[var(--text-muted)] hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  {repo.language && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <FiStar size={11} className="text-yellow-500" /> {formatNumber(repo.stars)}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/user/${repo.owner}`)}
                  className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
                >
                  <FiGitBranch size={11} /> {repo.owner}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
          <FiHeart size={52} className="mx-auto text-[var(--text-muted)] mb-4 opacity-30" />
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">No favorites yet</h2>
          <p className="text-[var(--text-muted)] text-sm mb-6">Browse profiles and click the heart icon on repositories you love.</p>
          <button onClick={() => navigate('/search')} className="btn-primary mx-auto">
            Explore Profiles
          </button>
        </motion.div>
      )}
    </div>
  );
}
