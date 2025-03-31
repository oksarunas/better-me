import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the user object
interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null; // Updated to match backend and api.ts
}

// Define the authentication context type
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User | null) => void; // Allow null
  logout: () => void;
}

// Create the AuthContext with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap the app and provide authentication state
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = (newToken: string, userData: User | null) => { // Allow null
    console.log('Attempting to login with token:', { hasToken: !!newToken, userData });

    if (!newToken || newToken === "undefined") {
      console.error('Invalid token received during login');
      return;
    }

    // If userData is null, we still proceed with token-only login
    if (userData && (!userData.id)) {
      console.error('Invalid user data received during login');
      return;
    }

    try {
      // Store token in localStorage
      localStorage.setItem('authToken', newToken);
      // Store user data only if provided
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('user'); // Clear if no user data
      }

      // Update state
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);

      console.log('Login successful, state updated');
    } catch (error) {
      console.error('Error during login:', error);
      // Clear any partial state
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const logout = () => {
    // Remove token and user from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    // Clear state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Throw an error if the hook is used outside of an AuthProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};