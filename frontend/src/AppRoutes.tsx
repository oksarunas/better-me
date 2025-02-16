import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage/LandingPage";
import HabitTracker from "./components/HabitTracker/HabitTracker";
import Analytics from "./components/Analytics/Analytics";
import Profile from "./components/Profile/Profile";
import NotFoundPage from "./components/NotFoundPage";
import PrivacyPolicy from "./components/Privacy";
import TitleSetter from "./components/TitleSetter";
import Login from "./components/Login/Login";

interface ProtectedRouteProps {
  element: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const isAuthenticated = true;
  return isAuthenticated ? element : <div>You need to log in to access this page.</div>;
};

interface RouteConfig {
  path: string;
  element: React.ReactElement;
  meta?: {
    title: string;
  };
}

export const routes: RouteConfig[] = [
  { path: "/", element: <LandingPage />, meta: { title: "Home - Better Me App" } },
  { path: "/login", element: <Login />, meta: { title: "Sign In - Better Me App" } },
  { path: "/tracker", element: <ProtectedRoute element={<HabitTracker />} />, meta: { title: "Habit Tracker" } },
  { path: "/analytics", element: <ProtectedRoute element={<Analytics />} />, meta: { title: "Analytics" } },
  { path: "/profile", element: <ProtectedRoute element={<Profile />} />, meta: { title: "Profile Settings" } },
  { path: "/privacy", element: <PrivacyPolicy />, meta: { title: "Privacy Policy" } },
  { path: "*", element: <NotFoundPage />, meta: { title: "Page Not Found" } },
];


const AppRoutes: React.FC = () => {
  return (
    <>
      <TitleSetter />
      <Routes>
        {routes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Routes>
    </>
  );
};

export default AppRoutes;
