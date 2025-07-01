import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api_comptoiriste';
import logo from '../style/logo.png'; // Importation du logo
import '../style/login.css'; // Fichier CSS pour le style
import { FaExclamationTriangle, FaBell, FaQuestionCircle } from 'react-icons/fa'; // Icônes

const LoginComptoiriste = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { user, token } = await apiService.loginComptoiriste(email, password);
      localStorage.setItem('token', token);
      navigate('/comptoiriste/dashboard');
    } catch (err) {
      setError('Identifiants incorrects');
    }
  };

  return (
    <div className="container">
      {/* Header Bienvenue Comptoiriste */}
      <div className="welcome-header">Bienvenue Mr le Comptoiriste</div>

      <div className="login-card">
        <img src={logo} alt="Logo" className="logo" />
        <h2>Connexion</h2>
        {error && <div className="error-message">{error}</div>}
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
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Se connecter
          </button>
        </form>
      </div>

      {/* Sidebar avec conseils sous le formulaire */}
      <div className="sidebar">
        <h3>Conseils importants</h3>
        <ul>
          <li><span className="icon"><FaExclamationTriangle /></span> Vérifiez bien vos informations avant de vous connecter.</li>
          <li><span className="icon"><FaBell /></span> Restez attentif aux notifications importantes.</li>
          <li><span className="icon"><FaQuestionCircle /></span> Si vous avez des questions, consultez la FAQ ou contactez le support.</li>
        </ul>
      </div>
    </div>
  );
};

export default LoginComptoiriste;
