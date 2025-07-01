const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const gerantRoutes = require('./routes/gerantRoutes');
const comptoiristeRoutes = require('./routes/comptoiristeRoutes');
const clientRoutes = require('./routes/clientRoutes');

const cors = require('cors');
const app = express();
const chatRoutes = require('./routes/chatRoutes');
require('dotenv').config();
const path = require('path');
// Connexion à MongoDB
connectDB();
app.use(express.urlencoded({ extended: true })); 
// Middleware
app.use(express.json());


const allowedOrigins = [
  'http://localhost:3001', // Admin
  'http://localhost:3002', // Gérant
  'http://localhost:3003', // Comptoiriste

];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
/*app.use(cors({
  origin: '*', // Pour le dev (à éviter en prod)
  // OU spécifiez les origines autorisées :
  // origin: ['http://localhost:3001', 'http://votre-app-mobile.com'],
  credentials: true,
}));*/
// Ajoutez cette ligne après app.use(cors())// Ajoutez cette ligne après app.use(cors())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));




// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/gerant', gerantRoutes);
app.use('/api/comptoiriste', comptoiristeRoutes);
app.use('/api/client', clientRoutes);

app.use('/api/chat', chatRoutes);





module.exports = app;