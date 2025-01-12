import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from '../components/LandingPage/LandingPage';
import HabitTracker from '../components/HabitTracker/HabitTracker';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tracker" element={<HabitTracker />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
