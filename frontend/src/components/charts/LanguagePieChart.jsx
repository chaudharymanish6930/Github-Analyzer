import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { getLanguageColor } from '../../utils/helpers';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: data } = payload[0];
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.fill }} />
        {name}
      </div>
      <p className="text-[var(--text-muted)] mt-0.5">{value} repos · {data.percentage}%</p>
    </div>
  );
};

export default function LanguagePieChart({ topLanguages }) {
  if (!topLanguages?.length) return null;

  const data = topLanguages.map(l => ({
    name: l.language,
    value: l.count,
    percentage: l.percentage,
    fill: getLanguageColor(l.language)
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6"
    >
      <h3 className="section-title mb-6">Language Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.fill} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-[var(--text-secondary)]">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
