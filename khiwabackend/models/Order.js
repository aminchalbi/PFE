const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  products: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product',
      required: true,
      
       // Force la conversion en string
    },
    
    
    quantity: { 
      type: Number,
    
      min: 1,
      required: true 
    }
  }],
  status: { 
    type: String, 
    enum: ['pending', 'preparing', 'ready', 'delivered'], 
    default: 'pending' 
  },
  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  salon: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Salon',
    required: true 
  },
  total: {
    type: Number,
    required:false
  },
  tableNumber: {  // Ajoutez ce champ
    type: String,
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  isCancelled: { 
    type: Boolean, 
    default: false 
  },
  cancellationReason: String,
  cancelledAt: Date
}, { timestamps: true }

);
// Dans models/Order.js
module.exports = mongoose.model('Order', orderSchema);
