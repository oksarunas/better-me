// App.tsx
import React from "react";
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from "./AppRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/global.css";
import { AuthProvider } from './contexts/AuthContext';  

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
                <ToastContainer />
            </AuthProvider>
        </Router>
    );
};

export default App;
