const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

reviewSchema.index({ salon: 1, product: 1, client: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);