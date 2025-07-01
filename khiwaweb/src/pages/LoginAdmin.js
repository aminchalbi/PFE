import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import adminServices from '../services/api_admin';
import '../styles/loginadmin.css';
import logo from '../styles/logo.png';

const LoginAdmin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await adminServices.loginAdmin({ email, password });
      localStorage.setItem('token', response.token);
      navigate('/dashboard');
    } catch (err) {
      setError('Identifiants incorrects');
    }
  };

  return (
    <div className="login-container">
      <div className="login-header-full">
        <h1 className="login-title-main-large">Bienvenue Admin</h1>
      </div>

      <div className="login-content">
        <div className="login-box">
          <img src={logo} alt="Logo" className="login-logo" />
          <h2 className="login-title">Bienvenue au Salon de Thé</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              required
            />

            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                required
              />
              <div
                className={`password-eye ${showPassword ? '' : 'closed'}`}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-button">
              Se connecter
            </button>
          </form>

          <div className="login-tip">
            <h3 className="tip-title">🧠 Conseil du jour</h3>
            <p className="tip-text">
              Cette application est conçue pour une gestion rigoureuse et moderne de Application"9hiwa".  
              Prenez des décisions réfléchies, soyez attentif aux détails.  
              C’est un outil innovant, fluide et performant pour satisfaire votre clientèle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginAdmin;
