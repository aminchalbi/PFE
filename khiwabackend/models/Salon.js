const mongoose = require('mongoose');

const salonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  gerant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comptoiristes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  images: [{ type: String }],
  reviews: [{
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
// Dans models/Salon.js
location: {
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  }

  },
  reviewCount: { type: Number, default: 0 },
  openingHours: {
    open: { type: String },
    close: { type: String }
  },
  description: { type: String },
  phone: { type: String },
  email: { type: String }
}, { timestamps: true });


salonSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Salon', salonSchema);