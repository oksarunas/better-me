// TitleSetter.tsx
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
// Make sure the path is correct and matches the file name and location
import { routes } from "../AppRoutes"; 

const TitleSetter: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    // This simple lookup assumes flat routes; adjust as needed for nested routes.
    const route = routes.find((r) => r.path === currentPath);
    document.title = route?.meta?.title || "Better Me App";
  }, [location]);

  return null;
};

export default TitleSetter;
