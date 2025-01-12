import React, { useState } from "react";

const Header = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.body.className = darkMode ? "" : "dark-mode";
  };

  return (
    <header>
      <h1>Daily Progress Tracker</h1>
      <div id="theme-toggle-container">
        <button
          id="theme-toggle"
          className="btn"
          aria-label="Toggle theme"
          onClick={toggleTheme}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </header>
  );
};

export default Header;
