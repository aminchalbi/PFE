import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../style/login.css'; // Import du CSS
import logo from '../style/logo.png'; // Import du logo
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Icônes de l'œil
import gerantPhoto from '../style/download.png';
const LoginGerant = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/gerant/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', 'gerant');
      navigate('/dashboard'); // Redirection vers le dashboard
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect');
    }
  };

  return (
    <div className="container">
      {/* Header Bienvenue Mr le Gérant */}
      <div className="welcome-section">
        <h1 className="welcome-header">Bienvenue Mr le Gérant</h1>
        <div className="gerant-photo-container">
          <img src={gerantPhoto} alt="Photo du Gérant" className="gerant-photo" />
        </div>
      </div>
      <div className="login-box">
        <img src={logo} alt="Logo" className="logo" />
        <h2>Connexion</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group password-container">
            <label>Mot de passe</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="password-input"
            />
            <span 
              className="eye-icon" 
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <button type="submit" className="login-button">Se connecter</button>
        </form>
      </div>

      {/* Sidebar avec conseils sous le formulaire */}
      <div className="sidebar">
        <h3>Conseil du jour</h3>
        <ul>
          <li><span className="icon">⚠️</span> Assurez-vous que vos informations sont correctes.</li>
          <li><span className="icon">🔒</span> Vérifiez votre connexion avant de vous connecter.</li>
          <li><span className="icon">❓</span> Si vous avez oublié votre mot de passe, contactez le support.</li>
        </ul>
      </div>
    </div>
  );
};

export default LoginGerant;
