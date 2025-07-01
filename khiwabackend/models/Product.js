const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: { type: String }, // URL de l'image du produit
  ingredients: [
    {
      ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true  },
      quantity: { type: Number, required: true , required: true },
    },
  ],
    isOnPromo: { type: Boolean, default: false },
  promoDetails: {
    promoPrice: Number,
    originalPrice: Number,
    startDate: Date,
    endDate: Date,
    promoLabel: String
  },
  salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true  },
 /* category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }// Nom de la catégorie*/
 category: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'Category' 
}
});

module.exports = mongoose.model('Product', productSchema);