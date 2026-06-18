import { useState, useCallback } from 'react';
import { userService } from '../services/githubService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const useFavorites = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const isFavorite = useCallback((repoId) => {
    return user?.favoriteRepos?.some(r => r.repoId === repoId) || false;
  }, [user]);

  const toggleFavorite = useCallback(async (repo) => {
    if (!isAuthenticated) {
      toast.error('Login to save favorites');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite(repo.id)) {
        await userService.removeFavorite(repo.id);
        updateUser({ favoriteRepos: user.favoriteRepos.filter(r => r.repoId !== repo.id) });
        toast.success('Removed from favorites');
      } else {
        const res = await userService.addFavorite({
          repoId: repo.id,
          owner: repo.full_name?.split('/')[0] || '',
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          stars: repo.stargazers_count,
          language: repo.language
        });
        updateUser({ favoriteRepos: res.data.favoriteRepos });
        toast.success('Added to favorites');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update favorites');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isFavorite, user, updateUser]);

  return { isFavorite, toggleFavorite, loading };
};

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useState(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  });

  return debouncedValue;
};
