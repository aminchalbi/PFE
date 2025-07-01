import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/LoginAdmin';
import Dashboard from './pages/DashboardAdmin';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';

const App = () => {
  return (
    <Router>
      <div className="app-wrapper">
        <Routes>
          <Route path="/login" element={<><Login /><Footer /></>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <>
                  <Dashboard />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<><Login /><Footer /></>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
