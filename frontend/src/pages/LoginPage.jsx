import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiGithub, FiShield, FiZap, FiBarChart2, FiHeart } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const PERKS = [
  { icon: FiBarChart2, text: 'Save and track analyzed profiles' },
  { icon: FiHeart, text: 'Bookmark your favorite repositories' },
  { icon: FiZap, text: 'Personal dashboard with history' },
  { icon: FiShield, text: 'Secure GitHub OAuth — no passwords stored' }
];

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleGitHubLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    window.location.href = `${apiUrl}/auth/github`;
  };

  const errorMessages = {
    oauth_failed: 'GitHub OAuth authorization failed. Please try again.',
    token_exchange_failed: 'Failed to exchange token. Please try again.',
    server_error: 'An unexpected server error occurred. Please try again.'
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/6 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-card p-8 text-center">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center mx-auto mb-6 shadow-brand-lg">
            <FiGithub size={30} className="text-white" />
          </div>

          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-2">
            Welcome to GitAnalyzer
          </h1>
          <p className="text-[var(--text-muted)] text-sm mb-8 leading-relaxed">
            Sign in with GitHub to unlock your personal dashboard, save favorites, and track your analytics history.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {errorMessages[error] || 'An error occurred. Please try again.'}
            </div>
          )}

          {/* GitHub Login button */}
          <button
            onClick={handleGitHubLogin}
            className="w-full py-3.5 px-6 flex items-center justify-center gap-3 bg-[#24292e] dark:bg-[#f0f6fc] text-white dark:text-[#24292e] font-semibold rounded-xl hover:bg-[#2d3339] dark:hover:bg-[#d0dce8] transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] mb-6"
          >
            <FiGithub size={20} />
            Continue with GitHub
          </button>

          {/* Perks */}
          <div className="text-left space-y-3 pt-6 border-t border-[var(--border-color)]">
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <div className="w-6 h-6 rounded-lg bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-brand-500" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-4">
          By signing in, you agree to our Terms of Service. We only request read-only GitHub access.
        </p>
      </motion.div>
    </div>
  );
}
