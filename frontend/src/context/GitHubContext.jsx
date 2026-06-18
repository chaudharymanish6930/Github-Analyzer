import { createContext, useContext, useReducer, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const GitHubContext = createContext(null);

const initialState = {
  profile: null,
  repositories: [],
  analytics: null,
  compareData: null,
  isLoading: false,
  isCompareLoading: false,
  error: null,
  filters: { language: '', sort: 'updated', type: 'all', search: '' },
  currentUsername: null
};

function githubReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        profile: action.payload.profile,
        repositories: action.payload.repositories,
        analytics: action.payload.analytics,
        currentUsername: action.payload.profile.login,
        error: null
      };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload, profile: null };
    case 'COMPARE_START':
      return { ...state, isCompareLoading: true };
    case 'COMPARE_SUCCESS':
      return { ...state, isCompareLoading: false, compareData: action.payload };
    case 'COMPARE_ERROR':
      return { ...state, isCompareLoading: false };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function GitHubProvider({ children }) {
  const [state, dispatch] = useReducer(githubReducer, initialState);

  const fetchProfile = useCallback(async (username, force = false) => {
    if (!username?.trim()) return;
    dispatch({ type: 'FETCH_START' });

    try {
      const res = await api.get(`/github/user/${username.trim()}`, { params: force ? { force: 'true' } : {} });
      const { profile, repositories, analytics } = res.data.data;
      dispatch({ type: 'FETCH_SUCCESS', payload: { profile, repositories, analytics } });
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch profile';
      dispatch({ type: 'FETCH_ERROR', payload: msg });
      toast.error(msg);
      throw err;
    }
  }, []);

  const compareProfiles = useCallback(async (user1, user2) => {
    dispatch({ type: 'COMPARE_START' });
    try {
      const res = await api.get(`/github/compare/${user1}/${user2}`);
      dispatch({ type: 'COMPARE_SUCCESS', payload: res.data.data });
      return res.data.data;
    } catch (err) {
      dispatch({ type: 'COMPARE_ERROR' });
      toast.error(err.response?.data?.message || 'Failed to compare profiles');
      throw err;
    }
  }, []);

  const setFilters = useCallback((filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const getFilteredRepos = useCallback(() => {
    const { repositories, filters } = state;
    let filtered = [...repositories];

    if (filters.language) {
      filtered = filtered.filter(r => r.language === filters.language);
    }
    if (filters.type === 'fork') filtered = filtered.filter(r => r.is_fork);
    if (filters.type === 'source') filtered = filtered.filter(r => !r.is_fork);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }

    const sortFns = {
      updated: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
      stars: (a, b) => b.stargazers_count - a.stargazers_count,
      forks: (a, b) => b.forks_count - a.forks_count,
      name: (a, b) => a.name.localeCompare(b.name),
      created: (a, b) => new Date(b.created_at) - new Date(a.created_at)
    };

    filtered.sort(sortFns[filters.sort] || sortFns.updated);
    return filtered;
  }, [state]);

  return (
    <GitHubContext.Provider value={{
      ...state,
      fetchProfile,
      compareProfiles,
      setFilters,
      getFilteredRepos
    }}>
      {children}
    </GitHubContext.Provider>
  );
}

export const useGitHub = () => {
  const ctx = useContext(GitHubContext);
  if (!ctx) throw new Error('useGitHub must be used inside GitHubProvider');
  return ctx;
};
