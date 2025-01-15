import React from "react";
import AppRoutes from "./AppRoutes"; // Centralized routing component
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Toast styles
import "./styles/global.css"; // Global styles

// Root application component
const App: React.FC = () => {
    return (
        <main className="App">
            {/* Centralized routing */}
            <AppRoutes />

            {/* Toast notifications */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light" // Switch to "dark" for dark mode
            />
        </main>
    );
};

export default App;
