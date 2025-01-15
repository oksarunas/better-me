// NotFoundPage.js
import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
      <p className="text-gray-600">The page you’re looking for doesn’t exist.</p>
      <Link to="/" className="mt-4 text-blue-500 underline">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
