'use client';
// app/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Demo users — in production replace with real DB/JWT
const DEMO_USERS = [
  {
    id: 'demo001',
    email: 'demo@alphalens.ai',
    password: 'Alpha@2025',
    name: 'Pranish Kumar',
    plan: 'Pro',
    avatar: 'PK',
    joinedDate: 'Jan 2025',
  },
  {
    id: 'demo002',
    email: 'guest@alphalens.ai',
    password: 'guest123',
    name: 'Guest User',
    plan: 'Free',
    avatar: 'GU',
    joinedDate: 'Mar 2025',
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    try {
      const saved = localStorage.getItem('alphalens_user');
      if (saved) setUser(JSON.parse(saved));
    } catch {}
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const found = DEMO_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return { success: false, error: 'Invalid email or password' };
    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    localStorage.setItem('alphalens_user', JSON.stringify(safeUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('alphalens_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
