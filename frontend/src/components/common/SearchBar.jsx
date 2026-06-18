import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function SearchBar({ size = 'default', placeholder = 'Enter GitHub username...' }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/user/${query.trim()}`);
      setQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (username) => {
    navigate(`/user/${username}`);
    setQuery('');
    setShowSuggestions(false);
  };

  const isLarge = size === 'large';

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch}>
        <div className={`relative flex items-center glass rounded-2xl ${isLarge ? 'p-2' : ''} 
                        focus-within:ring-2 focus-within:ring-brand-400/40 transition-all duration-200`}>
          <FiSearch className={`absolute left-4 text-[var(--text-muted)] shrink-0 
                               ${isLarge ? 'text-xl' : 'text-base'}`} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            className={`w-full bg-transparent outline-none text-[var(--text-primary)] 
                       placeholder:text-[var(--text-muted)] font-medium
                       ${isLarge ? 'py-4 pl-12 pr-4 text-lg' : 'py-3 pl-10 pr-3 text-sm'}`}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <button
            type="submit"
            className={`shrink-0 btn-primary ${isLarge ? 'py-3.5 px-6 text-base' : 'py-2 px-4 text-sm'}`}
          >
            {isLarge ? (
              <>Analyze <FiArrowRight size={18} /></>
            ) : (
              <FiSearch size={16} />
            )}
          </button>
        </div>
      </form>

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 glass-card overflow-hidden z-50"
        >
          {suggestions.map(user => (
            <button
              key={user.id}
              onMouseDown={() => handleSuggestionClick(user.login)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors text-left"
            >
              <img src={user.avatar_url} alt={user.login} className="w-8 h-8 rounded-full" />
              <span className="text-sm font-medium text-[var(--text-primary)]">{user.login}</span>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
