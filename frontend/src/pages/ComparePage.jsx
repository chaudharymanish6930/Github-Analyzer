import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiGitBranch, FiArrowRight, FiLoader } from 'react-icons/fi';
import { useGitHub } from '../context/GitHubContext';
import CompareProfiles from '../components/compare/CompareProfiles';

export default function ComparePage() {
  const { compareProfiles, compareData, isCompareLoading } = useGitHub();
  const [user1, setUser1] = useState('');
  const [user2, setUser2] = useState('');
  const [error, setError] = useState('');

  const handleCompare = async (e) => {
    e.preventDefault();
    setError('');
    if (!user1.trim() || !user2.trim()) { setError('Please enter both usernames.'); return; }
    if (user1.trim().toLowerCase() === user2.trim().toLowerCase()) { setError('Please enter two different usernames.'); return; }
    try {
      await compareProfiles(user1.trim(), user2.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to compare profiles. Please check the usernames.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 badge bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 mb-4 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
          <FiGitBranch size={12} /> Developer Comparison
        </div>
        <h1 className="font-display text-4xl font-bold text-[var(--text-primary)] mb-3">
          Compare GitHub Profiles
        </h1>
        <p className="text-[var(--text-muted)] max-w-lg mx-auto">
          Enter two GitHub usernames to compare their stats, languages, and repositories side by side.
        </p>
      </motion.div>

      {/* Input form */}
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleCompare}
        className="glass-card p-6 max-w-2xl mx-auto mb-10"
      >
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-500 bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.5 rounded">1</span>
            <input
              type="text"
              value={user1}
              onChange={e => setUser1(e.target.value)}
              placeholder="First username..."
              className="input-field pl-12"
            />
          </div>

          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] shrink-0">
            <FiArrowRight size={16} />
          </div>

          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-500 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded">2</span>
            <input
              type="text"
              value={user2}
              onChange={e => setUser2(e.target.value)}
              placeholder="Second username..."
              className="input-field pl-12"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={isCompareLoading}
          className="btn-primary w-full justify-center mt-4 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isCompareLoading ? (
            <><FiLoader className="animate-spin" size={16} /> Comparing...</>
          ) : (
            <><FiGitBranch size={16} /> Compare Profiles</>
          )}
        </button>
      </motion.form>

      {/* Results */}
      {compareData && !isCompareLoading && (
        <CompareProfiles data={compareData} />
      )}

      {/* Placeholder when no data */}
      {!compareData && !isCompareLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-16"
        >
          <div className="flex justify-center gap-4 mb-6 opacity-20">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="w-20 h-20 rounded-2xl bg-brand-200 dark:bg-brand-900" />
            ))}
          </div>
          <p className="text-[var(--text-muted)]">Enter two usernames above to start comparing</p>
        </motion.div>
      )}
    </div>
  );
}
