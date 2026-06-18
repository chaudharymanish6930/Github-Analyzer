import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiSearch } from 'react-icons/fi';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="font-display text-[120px] font-bold text-gradient leading-none mb-4 select-none">404</div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-3">Page not found</h1>
        <p className="text-[var(--text-muted)] mb-8 text-sm leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/')} className="btn-primary">
            <FiHome size={15} /> Go Home
          </button>
          <button onClick={() => navigate('/search')} className="btn-secondary">
            <FiSearch size={15} /> Search Profiles
          </button>
        </div>
      </motion.div>
    </div>
  );
}
