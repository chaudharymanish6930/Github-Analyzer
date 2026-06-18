import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

export default function RepoGrowthChart({ reposByYear }) {
  if (!reposByYear || Object.keys(reposByYear).length === 0) return null;

  const sortedYears = Object.keys(reposByYear).sort();
  let cumulative = 0;
  const data = sortedYears.map(year => {
    cumulative += reposByYear[year];
    return {
      year,
      newRepos: reposByYear[year],
      totalRepos: cumulative
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6"
    >
      <h3 className="section-title mb-1">Repository Growth Over Time</h3>
      <p className="text-xs text-[var(--text-muted)] mb-6">Total repositories created per year</p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ left: -10, right: 10 }}>
          <defs>
            <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              backdropFilter: 'blur(16px)'
            }}
          />
          <Area type="monotone" dataKey="totalRepos" name="Total Repos" stroke="#6366f1" fill="url(#growthGrad)" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} />
          <Area type="monotone" dataKey="newRepos" name="New Repos" stroke="#8b5cf6" fill="url(#newGrad)" strokeWidth={2} dot={{ r: 2.5, fill: '#8b5cf6' }} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
