import { useMemo } from 'react';
import { useGitHub } from '../../context/GitHubContext';
import RepoCard from './RepoCard';
import { FiSearch, FiFilter } from 'react-icons/fi';

const SORT_OPTIONS = [
  { value: 'updated', label: 'Recently Updated' },
  { value: 'stars', label: 'Most Stars' },
  { value: 'forks', label: 'Most Forks' },
  { value: 'created', label: 'Newest' },
  { value: 'name', label: 'Name (A-Z)' }
];

export default function RepositoryList({ repositories }) {
  const { filters, setFilters, getFilteredRepos } = useGitHub();

  const languages = useMemo(() => {
    const langs = [...new Set(repositories.map(r => r.language).filter(Boolean))];
    return langs.sort();
  }, [repositories]);

  const filtered = getFilteredRepos();

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm" />
          <input
            type="text"
            value={filters.search}
            onChange={e => setFilters({ search: e.target.value })}
            placeholder="Filter repositories..."
            className="w-full pl-9 pr-3 py-2 glass rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-400/40 transition-all"
          />
        </div>

        {/* Language filter */}
        <select
          value={filters.language}
          onChange={e => setFilters({ language: e.target.value })}
          className="px-3 py-2 glass rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-400/40 cursor-pointer bg-transparent text-[var(--text-primary)]"
        >
          <option value="">All Languages</option>
          {languages.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={filters.type}
          onChange={e => setFilters({ type: e.target.value })}
          className="px-3 py-2 glass rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-400/40 cursor-pointer bg-transparent text-[var(--text-primary)]"
        >
          <option value="all">All Types</option>
          <option value="source">Sources Only</option>
          <option value="fork">Forks Only</option>
        </select>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={e => setFilters({ sort: e.target.value })}
          className="px-3 py-2 glass rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-400/40 cursor-pointer bg-transparent text-[var(--text-primary)]"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-[var(--text-muted)]">
          Showing <span className="text-[var(--text-primary)] font-medium">{filtered.length}</span> of{' '}
          <span className="text-[var(--text-primary)] font-medium">{repositories.length}</span> repositories
        </span>
        {(filters.search || filters.language || filters.type !== 'all') && (
          <button
            onClick={() => setFilters({ search: '', language: '', type: 'all' })}
            className="text-xs text-brand-500 hover:text-brand-600 transition-colors font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Repo grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((repo, i) => (
            <RepoCard key={repo.id} repo={repo} index={i} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <FiFilter size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-secondary)] font-medium">No repositories match your filters</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}
