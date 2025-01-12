import React from 'react';
import ReactDOM from 'react-dom/client'; // Updated import for React 18+
import './styles/global.css'; // Import global styles
import App from './App'; // Import the root App component

// Create the root and render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
