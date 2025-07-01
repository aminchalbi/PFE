import React from 'react';

const TestActivation = () => {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f0f0f0',
      textAlign: 'center',
      marginTop: '50px'
    }}>
      <h1 style={{ color: 'green' }}>Test réussi !</h1>
      <p>Si vous voyez ce message, la route fonctionne.</p>
      <p>Le problème ne vient pas du routage de base.</p>
    </div>
  );
};

export default TestActivation;