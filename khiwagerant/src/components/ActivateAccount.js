import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../style/active.css'; // Créez ce fichier CSS

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Token manquant dans l\'URL');
      return;
    }

    const activateAccount = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/activate-account?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Compte activé avec succès!');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 
                  'Erreur lors de l\'activation du compte. Le lien peut être expiré ou invalide.');
      }
    };

    activateAccount();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="activation-container">
        <h2>Activation en cours...</h2>
        <p>Veuillez patienter pendant que nous activons votre compte.</p>
      </div>
    );
  }

  return (
    <div className="activation-container">
      <h2>{status === 'success' ? 'Activation réussie!' : 'Erreur d\'activation'}</h2>
      <p>{message}</p>
      
      {status === 'success' ? (
        <button 
          onClick={() => navigate('/login')}
          className="activation-button"
        >
          Se connecter
        </button>
      ) : (
        <button 
          onClick={() => navigate('/login')}
          className="activation-button"
        >
          Retour à la page de connexion
        </button>
      )}
    </div>
  );
};

export default ActivateAccount;