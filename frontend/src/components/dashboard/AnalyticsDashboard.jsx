import { FiStar, FiGitBranch, FiEye, FiCode, FiGitCommit, FiBox } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { formatNumber } from '../../utils/helpers';
import { getLanguageColor } from '../../utils/helpers';

const StatCard = ({ icon: Icon, label, value, sub, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="stat-card"
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color}`}>
      <Icon size={18} className="text-white" />
    </div>
    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">{label}</p>
    <p className="font-display text-2xl font-bold text-[var(--text-primary)]">{value}</p>
    {sub && <p className="text-xs text-[var(--text-muted)]">{sub}</p>}
  </motion.div>
);

export default function AnalyticsDashboard({ analytics, profile }) {
  const { totalStars, totalForks, totalWatchers, topLanguages, totalSize } = analytics;

  const sizeMB = (totalSize / 1024).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard icon={FiBox} label="Total Repos" value={profile.public_repos} color="bg-blue-500" delay={0} />
        <StatCard icon={FiStar} label="Total Stars" value={formatNumber(totalStars)} color="bg-yellow-500" delay={0.05} />
        <StatCard icon={FiGitBranch} label="Total Forks" value={formatNumber(totalForks)} color="bg-purple-500" delay={0.1} />
        <StatCard icon={FiEye} label="Watchers" value={formatNumber(totalWatchers)} color="bg-green-500" delay={0.15} />
        <StatCard icon={FiCode} label="Languages" value={Object.keys(analytics.languages || {}).length} color="bg-indigo-500" delay={0.2} />
        <StatCard icon={FiGitCommit} label="Total Size" value={`${sizeMB} MB`} sub="all repos combined" color="bg-pink-500" delay={0.25} />
      </div>

      {/* Top languages bar */}
      {topLanguages?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="section-title mb-5">Most Used Languages</h3>
          <div className="space-y-3">
            {topLanguages.slice(0, 8).map(({ language, count, percentage }) => (
              <div key={language}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getLanguageColor(language) }}
                    />
                    <span className="text-sm font-medium text-[var(--text-primary)]">{language}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{count} repos · {percentage}%</span>
                </div>
                <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: getLanguageColor(language) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
