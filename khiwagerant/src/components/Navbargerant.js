import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ salonName }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="navbar">
      <h2>Bienvenue a {salonName} mr le gerant </h2>
      <button onClick={handleLogout}>Déconnexion</button>
    </div>
  );
};

export default Navbar;