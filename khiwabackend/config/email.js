const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail', // ou autre service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD  
  }
});

const sendGerantCredentials = async (email, password) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Vos identifiants Gérant',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Bienvenue sur notre plateforme</h2>
        <p>Voici vos identifiants pour accéder à votre espace gérant :</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Mot de passe :</strong> ${password}</p>
        </div>
        
        <p>Vous pouvez vous connecter dès maintenant :</p>
        <a href="${process.env.FRONTEND_URL}/login" 
           style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Se connecter
        </a>
        
        <p style="margin-top: 20px;">Si vous souhaitez modifier ces informations, veuillez contacter notre support.</p>
        
        <p style="font-size: 12px; color: #7f8c8d; margin-top: 30px;">
          Cet email contient des informations sensibles, veuillez ne pas le partager.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email d\'identifiants envoyé');
  } catch (error) {
    console.error('Erreur lors de l\'envoi des identifiants:', error);
    throw error;
  }
};


module.exports = { sendGerantCredentials};