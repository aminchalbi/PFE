
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  products: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  price: { type: Number, required: true },
  image: String,
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);