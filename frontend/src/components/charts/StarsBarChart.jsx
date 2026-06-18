import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <p className="font-medium text-[var(--text-primary)] truncate max-w-[160px]">{label}</p>
      <p className="text-[var(--text-muted)]">⭐ {payload[0].value} stars</p>
    </div>
  );
};

export default function StarsBarChart({ repositories }) {
  const data = [...repositories]
    .filter(r => r.stargazers_count > 0)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 10)
    .map(r => ({
      name: r.name.length > 16 ? r.name.substring(0, 14) + '…' : r.name,
      stars: r.stargazers_count,
      fullName: r.name
    }));

  if (!data.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-6"
    >
      <h3 className="section-title mb-6">Most Starred Repositories</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: -10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
          <Bar
            dataKey="stars"
            fill="#6366f1"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
