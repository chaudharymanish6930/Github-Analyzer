import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGitHub } from '../context/GitHubContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import RepositoryList from '../components/profile/RepositoryList';
import AnalyticsDashboard from '../components/dashboard/AnalyticsDashboard';
import LanguagePieChart from '../components/charts/LanguagePieChart';
import StarsBarChart from '../components/charts/StarsBarChart';
import RepoGrowthChart from '../components/charts/RepoGrowthChart';
import { ProfileSkeleton, RepoSkeleton, ChartSkeleton } from '../components/common/Skeletons';
import { FiGrid, FiList, FiBarChart2, FiAlertCircle, FiSearch } from 'react-icons/fi';

const TABS = [
  { id: 'overview', label: 'Overview', icon: FiGrid },
  { id: 'repositories', label: 'Repositories', icon: FiList },
  { id: 'analytics', label: 'Analytics', icon: FiBarChart2 }
];

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { fetchProfile, profile, repositories, analytics, isLoading, error } = useGitHub();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (username) fetchProfile(username);
  }, [username]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <ProfileSkeleton />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <ChartSkeleton key={i} height={60} />)}
        </div>
        <RepoSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-12 max-w-md mx-auto">
          <FiAlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">Profile Not Found</h2>
          <p className="text-[var(--text-muted)] text-sm mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary mx-auto">
            <FiSearch size={15} /> Search Again
          </button>
        </motion.div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Profile header */}
      <ProfileHeader profile={profile} analytics={analytics} />

      {/* Tabs */}
      <div className="flex gap-1 glass-card p-1.5 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${activeTab === id
                ? 'bg-brand-500 text-white shadow-brand'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <AnalyticsDashboard analytics={analytics} profile={profile} />
            <div className="grid md:grid-cols-2 gap-6">
              <LanguagePieChart topLanguages={analytics?.topLanguages} />
              <StarsBarChart repositories={repositories} />
            </div>
            <RepoGrowthChart reposByYear={analytics?.reposByYear} />
            {/* Top repos preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Top Repositories</h3>
                <button onClick={() => setActiveTab('repositories')} className="text-sm text-brand-500 hover:text-brand-600 transition-colors font-medium">
                  View all →
                </button>
              </div>
              <RepositoryList repositories={repositories.slice(0, 6)} />
            </div>
          </div>
        )}

        {activeTab === 'repositories' && (
          <RepositoryList repositories={repositories} />
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsDashboard analytics={analytics} profile={profile} />
            <div className="grid md:grid-cols-2 gap-6">
              <LanguagePieChart topLanguages={analytics?.topLanguages} />
              <StarsBarChart repositories={repositories} />
            </div>
            <RepoGrowthChart reposByYear={analytics?.reposByYear} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
