import { createContext, useContext, useState, useEffect } from 'react';
 
const AuthContext = createContext(null);
 
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
 
  useEffect(() => {
    if (token) {
      // Decode JWT to get user info (without verification — server verifies)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ email: payload.email, role: payload.role, id: payload.sub });
      } catch {
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
      {children}
    </AuthContext.Provider>
  );
}
 
export const useAuth = () => useContext(AuthContext);
