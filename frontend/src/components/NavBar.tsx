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
    <nav className="bg-gray-800 p-3 sm:p-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 w-full sm:w-auto">
          <Link to="/" className="text-white text-lg sm:text-xl font-bold">
            HabitTracker
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/tracker" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                Habits
              </Link>
              <Link to="/sleep" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                Sleep
              </Link>
              <Link to="/analytics" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                Analytics
              </Link>
              <Link to="/achievements" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                Achievements
              </Link>
              <Link to="/profile" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                Profile
              </Link>
            </>
          )}
        </div>
        <div className="w-full sm:w-auto">
          {isAuthenticated && (
            <button 
              onClick={handleSignOut}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm sm:text-base"
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