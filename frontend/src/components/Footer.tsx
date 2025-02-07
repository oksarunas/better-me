import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="mt-32 text-center space-y-4">
      <p className="text-gray-500">© 2025 Better Me. All rights reserved.</p>
      <div className="flex items-center justify-center space-x-4">
        <a
          href="https://x.com/SKarpovicius"
          className="text-gray-500 hover:text-gray-400 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Twitter
        </a>
        <a
          href="https://github.com/oksarunas"
          className="text-gray-500 hover:text-gray-400 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <Link
          to="/privacy"
          className="text-gray-500 hover:text-gray-400 transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
