import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from '../components/LandingPage/LandingPage';
import HabitTracker from '../components/HabitTracker/HabitTracker';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Define routes with their respective components */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/tracker" element={<HabitTracker />} />
        {/* Add a fallback for undefined routes */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
