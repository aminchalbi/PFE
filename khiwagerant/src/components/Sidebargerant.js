import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>Menu</h2>
      <ul>
        <li><Link to="/products">Produits</Link></li>
        <li><Link to="/ingredients">Ingrédients</Link></li>
        <li><Link to="/orders">Commandes</Link></li>
        <li><Link to="/comptoiristes">Comptoiristes</Link></li>
        <li><Link to="/statistics">Statistiques</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;