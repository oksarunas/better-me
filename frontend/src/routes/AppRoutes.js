import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "../components/LandingPage/LandingPage";
import HabitTracker from "../components/HabitTracker/HabitTracker";
import NotFoundPage from "../components/NotFoundPage"; // New reusable 404 component

// Example protected route wrapper
const ProtectedRoute = ({ element }) => {
  const isAuthenticated = true; // Replace with actual authentication logic
  return isAuthenticated ? element : <div>You need to log in to access this page.</div>;
};

const AppRoutes = () => {
  React.useEffect(() => {
    // Update document title dynamically based on the current path
    const handleTitleUpdate = () => {
      const titles = {
        "/": "Welcome to Better Me",
        "/tracker": "Habit Tracker",
      };
      document.title = titles[window.location.pathname] || "Better Me App";
    };

    handleTitleUpdate();
    window.addEventListener("popstate", handleTitleUpdate); // Update on browser navigation

    return () => window.removeEventListener("popstate", handleTitleUpdate);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Define routes with their respective components */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/tracker"
          element={<ProtectedRoute element={<HabitTracker />} />}
        />
        {/* Add a fallback for undefined routes */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
