import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return { ...state, user: action.payload.user, token: action.payload.token, isAuthenticated: true, isLoading: false, error: null };
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...initialState, token: null, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'INIT_DONE':
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const initAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch({ type: 'INIT_DONE' });
      return;
    }

    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await api.get('/auth/me');
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: res.data.user, token } });
    } catch {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      dispatch({ type: 'INIT_DONE' });
    }
  }, []);

  useEffect(() => { initAuth(); }, [initAuth]);

  const loginWithToken = useCallback((token) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    initAuth();
  }, [initAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((updates) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, []);

  const updatePreferences = useCallback(async (prefs) => {
    const res = await api.put('/user/preferences', prefs);
    dispatch({ type: 'UPDATE_USER', payload: { preferences: res.data.preferences } });
    return res.data.preferences;
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, loginWithToken, logout, updateUser, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
