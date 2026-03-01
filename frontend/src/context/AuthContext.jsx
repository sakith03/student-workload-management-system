<<<<<<< HEAD
import { createContext, useContext, useState, useEffect } from 'react';
 
const AuthContext = createContext(null);
 
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
 
=======
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
  const [loading, setLoading] = useState(true);

>>>>>>> origin/develop
  useEffect(() => {
    if (token) {
      // Decode JWT to get user info (without verification — server verifies)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ email: payload.email, role: payload.role, id: payload.sub });
      } catch {
<<<<<<< HEAD
        logout();
      }
    }
  }, [token]);
 
  const login = (jwtToken) => {
    localStorage.setItem('jwt_token', jwtToken);
    setToken(jwtToken);
  };
 
  const logout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setUser(null);
  };
 
  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
=======
        // Bad token — clear it directly without calling logout() to avoid
        // re-triggering this same effect (logout mutates token → infinite loop)
        localStorage.removeItem('jwt_token');
        setToken(null);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = useCallback((jwtToken) => {
    localStorage.setItem('jwt_token', jwtToken);
    setToken(jwtToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
>>>>>>> origin/develop
      {children}
    </AuthContext.Provider>
  );
}
<<<<<<< HEAD
 
=======

>>>>>>> origin/develop
export const useAuth = () => useContext(AuthContext);
