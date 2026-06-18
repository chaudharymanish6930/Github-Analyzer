import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GitHubProvider } from './context/GitHubContext';

// Pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import ComparePage from './pages/ComparePage';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import FavoritesPage from './pages/FavoritesPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import Layout from './components/common/Layout';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="user/:username" element={<ProfilePage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route path="dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="favorites" element={
          <ProtectedRoute><FavoritesPage /></ProtectedRoute>
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GitHubProvider>
          <Router>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'glass text-[var(--text-primary)] text-sm font-medium',
                duration: 3500,
                style: {
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  backdropFilter: 'blur(16px)'
                }
              }}
            />
          </Router>
        </GitHubProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
