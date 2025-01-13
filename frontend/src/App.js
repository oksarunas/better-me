import React from "react";
import AppRoutes from "./routes/AppRoutes"; // Centralized routing component
import "./styles/global.css"; // Global styles

// Root application component
const App = () => {
    return (
        <main className="App">
            <AppRoutes />
        </main>
    );
};

export default App;
