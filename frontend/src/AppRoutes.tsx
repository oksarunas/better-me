import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LandingPage from "./components/LandingPage/LandingPage";
import HabitTracker from "./components/HabitTracker/HabitTracker";
import NotFoundPage from "./components/NotFoundPage";

interface ProtectedRouteProps {
  element: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
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
    path: "*",
    element: <NotFoundPage />,
    meta: { title: "404 - Page Not Found" },
  },
];

const router = createBrowserRouter(routes);

const TitleSetter: React.FC = () => {
  React.useEffect(() => {
    const handleTitleUpdate = () => {
      const route = routes.find((r) => r.path === window.location.pathname);
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
