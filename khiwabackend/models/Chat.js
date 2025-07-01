// models/Chat.js - Version améliorée
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: String,
  sender: { type: String, enum: ['user', 'bot'], required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    // Pour stocker des infos supplémentaires sur le message
    productId: mongoose.Schema.Types.ObjectId,
    context: String, // "sport", "stress", "fatigue", etc.
    isRecommendation: Boolean
  }
}, { _id: false });

const chatSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  messages: [messageSchema],
  context: {
    // Contexte de la conversation pour personnalisation
    lastActivity: { type: String, enum: ['sport', 'travail', 'detente', null] },
    mood: { type: String, enum: ['stressé', 'fatigué', 'heureux', null] },
    preferences: [{ type: String }] // Préférences utilisateur (thé, café, etc.)
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

chatSchema.index({ userId: 1, updatedAt: -1 });
chatSchema.index({ "context.lastActivity": 1 });
chatSchema.index({ "context.mood": 1 });

module.exports = mongoose.model('Chat', chatSchema);