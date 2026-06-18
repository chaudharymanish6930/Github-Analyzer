import { FiMapPin, FiLink, FiTwitter, FiUsers, FiGitBranch, FiStar, FiExternalLink, FiRefreshCw, FiDownload } from 'react-icons/fi';
import { FaBuilding } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { formatNumber, formatDate } from '../../utils/helpers';
import { exportProfilePDF } from '../../utils/exportPDF';
import { useGitHub } from '../../context/GitHubContext';

export default function ProfileHeader({ profile, analytics }) {
  const { repositories, fetchProfile, currentUsername } = useGitHub();

  const stats = [
    { label: 'Repositories', value: formatNumber(profile.public_repos), icon: FiGitBranch, color: 'text-blue-500' },
    { label: 'Followers', value: formatNumber(profile.followers), icon: FiUsers, color: 'text-purple-500' },
    { label: 'Following', value: formatNumber(profile.following), icon: FiUsers, color: 'text-indigo-500' },
    { label: 'Total Stars', value: formatNumber(analytics?.totalStars || 0), icon: FiStar, color: 'text-yellow-500' }
  ];

  const handleExport = () => exportProfilePDF(profile, analytics, repositories);
  const handleRefresh = () => fetchProfile(currentUsername, true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 sm:p-8"
    >
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar */}
        <div className="shrink-0 self-start">
          <div className="relative">
            <img
              src={profile.avatar_url}
              alt={profile.name || profile.login}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-[var(--border-color)] shadow-glass"
            />
            <a
              href={profile.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute -bottom-2 -right-2 w-7 h-7 bg-[var(--bg-primary)] rounded-full flex items-center justify-center border border-[var(--border-color)] shadow-sm hover:text-brand-500 transition-colors"
            >
              <FiExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] truncate">
                {profile.name || profile.login}
              </h1>
              <a
                href={profile.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-muted)] text-sm hover:text-brand-500 transition-colors font-mono"
              >
                @{profile.login}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} className="btn-ghost p-2.5 rounded-xl" title="Refresh data">
                <FiRefreshCw size={16} />
              </button>
              <button onClick={handleExport} className="btn-secondary text-sm gap-2">
                <FiDownload size={15} /> Export PDF
              </button>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-3 text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl">
              {profile.bio}
            </p>
          )}

          {/* Meta */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {profile.location && (
              <span className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                <FiMapPin size={13} className="text-brand-400" /> {profile.location}
              </span>
            )}
            {profile.company && (
              <span className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                <FaBuilding size={12} className="text-brand-400" /> {profile.company}
              </span>
            )}
            {profile.blog && (
              <a
                href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-600 transition-colors"
              >
                <FiLink size={13} /> {profile.blog.replace(/^https?:\/\//, '')}
              </a>
            )}
            {profile.twitter_username && (
              <a
                href={`https://twitter.com/${profile.twitter_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-sky-500 hover:text-sky-600 transition-colors"
              >
                <FiTwitter size={13} /> @{profile.twitter_username}
              </a>
            )}
          </div>

          {/* Member since */}
          <div className="mt-3">
            <span className="badge bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 text-xs">
              Member since {formatDate(profile.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[var(--border-color)]">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1">
              <Icon size={14} className={color} />
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">{label}</span>
            </div>
            <p className="font-display text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
