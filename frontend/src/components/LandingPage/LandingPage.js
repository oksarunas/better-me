import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <h1 className="landing-title">Welcome to Better Me</h1>
      <p className="landing-description">
        Track your habits and build a better version of yourself.
      </p>
      <Link to="/tracker">
        <button className="cta-button" aria-label="Get Started and Go to Habit Tracker">
          Get Started
        </button>
      </Link>
    </div>
  );
};

export default LandingPage;
