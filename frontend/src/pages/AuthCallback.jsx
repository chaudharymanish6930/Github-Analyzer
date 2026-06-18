import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLoader } from 'react-icons/fi';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      loginWithToken(token);
      // Auth context will handle redirect via useEffect in App
      setTimeout(() => navigate('/dashboard', { replace: true }), 500);
    } else {
      navigate('/login?error=no_token', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center animate-pulse">
        <FiLoader size={22} className="text-white animate-spin" />
      </div>
      <p className="text-[var(--text-muted)] text-sm">Signing you in...</p>
    </div>
  );
}
