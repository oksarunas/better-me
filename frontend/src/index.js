// Import React and ReactDOM for React 18+
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import global styles
import './styles/global.css';

// Import the root App component
import App from './App';

// Create and render the root of the application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
