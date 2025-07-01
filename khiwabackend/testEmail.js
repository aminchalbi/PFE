const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Envoyez à vous-même pour tester
      subject: 'Test SMTP',
      text: 'Ceci est un test'
    });
    console.log('Email envoyé:', info.messageId);
  } catch (error) {
    console.error('Erreur SMTP:', error);
  }
}

testEmail();