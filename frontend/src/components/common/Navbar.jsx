import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FiSearch, FiMoon, FiSun, FiGitBranch, FiGrid,
  FiHeart, FiMenu, FiX, FiLogOut, FiUser
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const NavLink = ({ to, children, onClick }) => {
  const { pathname } = useLocation();
  const isActive = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive
          ? 'bg-brand-500/10 text-brand-500 dark:text-brand-400'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
        }`}
    >
      {children}
    </Link>
  );
};

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/user/${searchQuery.trim()}`);
      setSearchQuery('');
      setMobileOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-brand">
              <FiGitBranch className="text-white text-base" />
            </div>
            <span className="font-display font-bold text-lg text-gradient hidden sm:block">
              GitAnalyzer
            </span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-sm hidden md:flex">
            <div className="relative w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search GitHub username..."
                className="w-full pl-9 pr-4 py-2 glass rounded-xl text-sm text-[var(--text-primary)] 
                           placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-brand-400/40 transition-all"
              />
            </div>
          </form>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/search"><FiSearch size={15} /> Search</NavLink>
            <NavLink to="/compare"><FiGitBranch size={15} /> Compare</NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/dashboard"><FiGrid size={15} /> Dashboard</NavLink>
                <NavLink to="/favorites"><FiHeart size={15} /> Favorites</NavLink>
              </>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              className="btn-ghost p-2 rounded-lg"
              aria-label="Toggle theme"
            >
              {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="flex items-center gap-2">
                  <img
                    src={user?.avatar}
                    alt={user?.username}
                    className="w-8 h-8 rounded-full border-2 border-brand-400/30 object-cover"
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)] hidden sm:block max-w-[100px] truncate">
                    {user?.name || user?.username}
                  </span>
                </Link>
                <button onClick={logout} className="btn-ghost p-2 rounded-lg text-red-500 hover:text-red-600">
                  <FiLogOut size={16} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm py-2">
                <FiUser size={15} /> Login
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden btn-ghost p-2 rounded-lg"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-primary)]"
          >
            <div className="px-4 py-3 space-y-1">
              <form onSubmit={handleSearch} className="mb-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search GitHub username..."
                    className="w-full pl-9 pr-4 py-2.5 glass rounded-xl text-sm outline-none"
                  />
                </div>
              </form>
              <NavLink to="/search" onClick={() => setMobileOpen(false)}><FiSearch size={15} /> Search</NavLink>
              <NavLink to="/compare" onClick={() => setMobileOpen(false)}><FiGitBranch size={15} /> Compare</NavLink>
              {isAuthenticated && (
                <>
                  <NavLink to="/dashboard" onClick={() => setMobileOpen(false)}><FiGrid size={15} /> Dashboard</NavLink>
                  <NavLink to="/favorites" onClick={() => setMobileOpen(false)}><FiHeart size={15} /> Favorites</NavLink>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
