// App.tsx
import React from "react";
import AppRoutes from "./AppRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/global.css";
import NavBar from './components/NavBar';
import { AuthProvider } from './contexts/AuthContext';  

const App: React.FC = () => {
    return (
        <AuthProvider>
            <main className="App">
                <NavBar />
                <AppRoutes />
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
                    theme="light"
                />
            </main>
        </AuthProvider>
    );
};

export default App;
