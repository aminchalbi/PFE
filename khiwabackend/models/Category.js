const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true // Empêche les doublons de noms de catégories
  },
  description: String,
  image: String, // URL de l'image
  salon: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Salon', 
    required: true 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Category', categorySchema);