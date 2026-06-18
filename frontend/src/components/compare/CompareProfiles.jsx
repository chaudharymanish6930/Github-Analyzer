import { FiUsers, FiStar, FiGitBranch, FiBox, FiCode } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { formatNumber } from '../../utils/helpers';
import { getLanguageColor } from '../../utils/helpers';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

const WinnerBadge = ({ show }) =>
  show ? <span className="badge bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-[10px] ml-2">Winner</span> : null;

const MetricRow = ({ label, val1, val2, icon: Icon }) => {
  const isFirst = val1 >= val2;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--border-color)] last:border-0">
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] w-28 shrink-0">
        <Icon size={14} /> {label}
      </div>
      <div className={`flex-1 text-right font-semibold text-sm ${isFirst ? 'text-brand-500' : 'text-[var(--text-primary)]'}`}>
        {formatNumber(val1)} {val1 >= val2 && val1 !== val2 && <WinnerBadge show />}
      </div>
      <div className="w-6 text-center text-xs text-[var(--text-muted)]">vs</div>
      <div className={`flex-1 text-left font-semibold text-sm ${!isFirst ? 'text-brand-500' : 'text-[var(--text-primary)]'}`}>
        {val2 >= val1 && val2 !== val1 && <WinnerBadge show />} {formatNumber(val2)}
      </div>
    </div>
  );
};

export default function CompareProfiles({ data }) {
  const { profiles, metrics } = data;
  const [p1, p2] = profiles;

  const radarData = [
    { metric: 'Repos', A: p1.profile.public_repos, B: p2.profile.public_repos },
    { metric: 'Followers', A: p1.profile.followers, B: p2.profile.followers },
    { metric: 'Stars', A: p1.analytics.totalStars, B: p2.analytics.totalStars },
    { metric: 'Forks', A: p1.analytics.totalForks, B: p2.analytics.totalForks },
    { metric: 'Following', A: p1.profile.following, B: p2.profile.following }
  ];

  // Normalize for radar
  const maxVals = radarData.map(d => Math.max(d.A, d.B, 1));
  const normalizedRadar = radarData.map((d, i) => ({
    metric: d.metric,
    [p1.profile.login]: Math.round((d.A / maxVals[i]) * 100),
    [p2.profile.login]: Math.round((d.B / maxVals[i]) * 100)
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Profile cards side by side */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[p1, p2].map((p, i) => (
          <div key={p.profile.login} className="glass-card p-5 flex items-center gap-4">
            <img src={p.profile.avatar_url} alt={p.profile.login} className="w-16 h-16 rounded-xl object-cover shrink-0" />
            <div>
              <p className="font-display font-bold text-[var(--text-primary)]">{p.profile.name || p.profile.login}</p>
              <p className="text-sm text-[var(--text-muted)] font-mono">@{p.profile.login}</p>
              {p.profile.bio && <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1">{p.profile.bio}</p>}
              <span className={`badge text-[10px] mt-1 ${i === 0 ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-500' : 'bg-purple-50 dark:bg-purple-950/30 text-purple-500'}`}>
                Profile {i + 1}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Metrics comparison */}
        <div className="glass-card p-6">
          <h3 className="section-title mb-4">Head to Head</h3>
          <div className="flex justify-between text-xs text-[var(--text-muted)] font-medium mb-2 px-1">
            <span className="text-brand-500">@{p1.profile.login}</span>
            <span></span>
            <span className="text-purple-500">@{p2.profile.login}</span>
          </div>
          <MetricRow label="Followers" val1={metrics.followers[0]} val2={metrics.followers[1]} icon={FiUsers} />
          <MetricRow label="Repos" val1={metrics.publicRepos[0]} val2={metrics.publicRepos[1]} icon={FiBox} />
          <MetricRow label="Stars" val1={metrics.totalStars[0]} val2={metrics.totalStars[1]} icon={FiStar} />
          <MetricRow label="Forks" val1={metrics.totalForks[0]} val2={metrics.totalForks[1]} icon={FiGitBranch} />
          <MetricRow label="Following" val1={metrics.following[0]} val2={metrics.following[1]} icon={FiUsers} />
        </div>

        {/* Radar chart */}
        <div className="glass-card p-6">
          <h3 className="section-title mb-4">Radar Comparison</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={normalizedRadar}>
              <PolarGrid stroke="var(--border-color)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Radar name={p1.profile.login} dataKey={p1.profile.login} stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              <Radar name={p2.profile.login} dataKey={p2.profile.login} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
              <Tooltip
                contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '12px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 mt-3">
            <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-full bg-brand-500" /> @{p1.profile.login}</div>
            <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-full bg-purple-500" /> @{p2.profile.login}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
