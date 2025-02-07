import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LandingPage from "./components/LandingPage/LandingPage";
import HabitTracker from "./components/HabitTracker/HabitTracker";
import NotFoundPage from "./components/NotFoundPage";
import PrivacyPolicy from "./components/Privacy";  // Ensure this path is correct

interface ProtectedRouteProps {
  element: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  // Replace this with actual authentication logic when ready.
  const isAuthenticated = true;
  return isAuthenticated ? element : <div>You need to log in to access this page.</div>;
};

const routes = [
  {
    path: "/",
    element: <LandingPage />,
    meta: { title: "Welcome to Better Me" },
  },
  {
    path: "/tracker",
    element: <ProtectedRoute element={<HabitTracker />} />,
    meta: { title: "Habit Tracker" },
  },
  {
    path: "/privacy",
    element: <PrivacyPolicy />,
    meta: { title: "Privacy Policy" },
  },
  {
    path: "*",
    element: <NotFoundPage />,
    meta: { title: "404 - Page Not Found" },
  },
];

const router = createBrowserRouter(routes);

const TitleSetter: React.FC = () => {
  React.useEffect(() => {
    const handleTitleUpdate = () => {
      // For a more robust solution, consider using router hooks like useMatches
      const currentPath = window.location.pathname;
      const route = routes.find((r) => r.path === currentPath);
      document.title = route?.meta?.title || "Better Me App";
    };

    handleTitleUpdate();
    window.addEventListener("popstate", handleTitleUpdate);
    return () => window.removeEventListener("popstate", handleTitleUpdate);
  }, []);
  return null;
};

const AppRoutes: React.FC = () => {
  return (
    <>
      <TitleSetter />
      <RouterProvider router={router} />
    </>
  );
};

export default AppRoutes;
