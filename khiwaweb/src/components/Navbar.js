import React from 'react';
import logo from '../styles/logo.png'; // Assurez-vous que le chemin est correct

const Navbar = ({ handleLogout }) => {
  return (
    <nav className="navbar">
      <h1>
        <img src={logo} alt="Logo" /> Admin Dashboard
      </h1>
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </nav>
  );
};

export default Navbar;