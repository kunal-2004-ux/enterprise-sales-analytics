import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './routes/DashboardPage';
import './styles/main.css';

function App() {
    return (
        <BrowserRouter>
            <div className="app-container">
                <header>
                    <h1>Sales Intelligence Dashboard</h1>
                </header>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
