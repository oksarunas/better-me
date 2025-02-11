import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Define the shape of the user object
interface User {
  id: string;
  email: string;
  name: string;
  // Add other user properties as needed
}

// Define the authentication context type
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// Create the AuthContext with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap the app and provide authentication state
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for storing authentication token and user
  const [token, setToken] = useState<string | null>(() => {
    const storedToken = localStorage.getItem('authToken');
    console.log('Initial token from localStorage:', storedToken);
    // Only return the token if it's a non-empty string
    return storedToken && storedToken !== "undefined" ? storedToken : null;
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    console.log('Initial user from localStorage:', storedUser);
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('Error parsing stored user:', e);
      return null;
    }
  });

  // Ensure token and user state are consistent
  useEffect(() => {
    if (!token || token === "undefined") {
      // If there's no valid token, ensure user is also cleared
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
    }
  }, [token]);

  // Login function to set token and user
  const login = (newToken: string, userData: User) => {
    console.log('Login called with:', { newToken, userData });
    
    if (!newToken || newToken === "undefined") {
      console.error('Invalid token provided to login');
      return;
    }
    
    // Store token and user in localStorage
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Update state
    setToken(newToken);
    setUser(userData);
    
    console.log('State updated:', { token: newToken, user: userData });
  };

  // Logout function to clear token and user
  const logout = () => {
    console.log('Logout called');
    
    // Remove token and user from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Clear state
    setToken(null);
    setUser(null);
    
    console.log('State cleared');
  };

  // Create the context value
  const value = {
    isAuthenticated: !!(token && token !== "undefined" && user),
    user,
    token,
    login,
    logout
  };

  console.log('AuthContext value:', value);

  return (
    <AuthContext.Provider value={value}>
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