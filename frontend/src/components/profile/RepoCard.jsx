import { FiStar, FiGitBranch, FiEye, FiAlertCircle, FiHeart, FiExternalLink, FiArchive } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { formatNumber, timeAgo, truncate, getLanguageColor } from '../../utils/helpers';
import { useFavorites } from '../../hooks/useCustomHooks';

export default function RepoCard({ repo, index = 0 }) {
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const isStarred = isFavorite(repo.id);
  const langColor = getLanguageColor(repo.language);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="glass-card p-5 flex flex-col gap-3 hover:border-brand-400/30 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--text-primary)] hover:text-brand-500 transition-colors truncate text-sm flex items-center gap-1.5 group/link"
            >
              {repo.name}
              <FiExternalLink size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
            </a>
            {repo.is_fork && (
              <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px]">
                fork
              </span>
            )}
            {repo.is_archived && (
              <span className="badge bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[10px]">
                <FiArchive size={10} /> archived
              </span>
            )}
            {repo.visibility === 'private' && (
              <span className="badge bg-red-50 dark:bg-red-950/20 text-red-500 text-[10px]">private</span>
            )}
          </div>
          {repo.description && (
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed line-clamp-2">
              {repo.description}
            </p>
          )}
        </div>
        <button
          onClick={() => toggleFavorite(repo)}
          disabled={loading}
          className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 shrink-0
            ${isStarred ? 'text-red-500' : 'text-[var(--text-muted)] hover:text-red-400'}`}
        >
          <FiHeart size={15} fill={isStarred ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Topics */}
      {repo.topics?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {repo.topics.slice(0, 4).map(topic => (
            <span key={topic} className="badge bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 text-[10px]">
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Footer stats */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)] mt-auto">
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          {repo.language && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: langColor }} />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1">
            <FiStar size={11} className="text-yellow-500" />
            {formatNumber(repo.stargazers_count)}
          </span>
          <span className="flex items-center gap-1">
            <FiGitBranch size={11} /> {formatNumber(repo.forks_count)}
          </span>
          {repo.open_issues_count > 0 && (
            <span className="flex items-center gap-1">
              <FiAlertCircle size={11} className="text-orange-400" /> {formatNumber(repo.open_issues_count)}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[var(--text-muted)] shrink-0">
          {timeAgo(repo.pushed_at)}
        </span>
      </div>
    </motion.div>
  );
}
