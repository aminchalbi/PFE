
import React from 'react';
import { BrowserRouter as Router, Routes, Route,Navigate } from 'react-router-dom';
import LoginGerant from './pages/Logingerant';
import Dashboard from './pages/DashboardGerant';
import ProtectedRoute from './components/ProtectedRouteGerant';
const App = () => {
  return (
    <Router>
      <Routes>
        {/* Route publique pour la connexion */}
        <Route path="/login" element={<LoginGerant />} />
        {/* Route protégée pour le dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Redirection par défaut vers le login */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};
export default App;


