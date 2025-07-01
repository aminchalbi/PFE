// src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes, } from 'react-router-dom';
import LoginComptoiriste from './pages/LoginComptoiriste';
import ComptoiristeDashboard from './pages/ComptoiristeDashboard';
import ProtectedRoute from './components/protectedRooutecomptoiriste';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Route publique */}
        <Route path="/login" element={<LoginComptoiriste />} />

        {/* Route protégée */}
        <Route
          path="/comptoiriste/dashboard"
          element={
            <ProtectedRoute>
              <ComptoiristeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirection par défaut */}
        <Route path="/" element={<LoginComptoiriste />} />
      </Routes>
    </Router>
  );
};

export default App;