const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Nom de l'ingrédient (ex: sucre, lait, etc.)
  quantity: { type: Number, required: true }, // Quantité disponible en stock
  unit: { type: String, required: true }, // Unité de mesure (ex: kg, litre, etc.)
  salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' }, // Référence au salon de thé
});

module.exports = mongoose.model('Ingredient', ingredientSchema);