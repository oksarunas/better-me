"use client";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const NavBar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
const handleSignOut = async () => {
  try {
    await logout();
    navigate('/login');
  } catch (error) {
    console.error('Sign out error:', error);
  }
};

  return (
    <nav className="bg-gray-800 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side: Logo and Navigation Links */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-white text-xl font-bold">
            HabitTracker
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/tracker" className="text-gray-300 hover:text-white transition-colors">
                Habits
              </Link>
              <Link to="/sleep" className="text-gray-300 hover:text-white transition-colors">
                Sleep
              </Link>
              <Link to="/analytics" className="text-gray-300 hover:text-white transition-colors">
                Analytics
              </Link>
              <Link to="/achievements" className="text-gray-300 hover:text-white transition-colors">
                Achievements
              </Link>
              <Link to="/profile" className="text-gray-300 hover:text-white transition-colors">
                Profile
              </Link>
            </>
          )}
        </div>
        {/* Right side: Sign Out Button */}
        <div>
          {isAuthenticated && (
            <button 
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
