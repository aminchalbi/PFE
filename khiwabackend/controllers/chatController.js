const Chat = require('../models/Chat');
const Product = require('../models/Product'); // Pour les suggestions de produits
const User = require('../models/User');
const mongoose = require('mongoose');
// Réponses enrichies avec logique métier
async function getSuggestions(query) {
  if (!query || query.length < 2) return [];
  
  const products = await Product.find({
    name: { $regex: query, $options: 'i' }
  }).limit(5);

  return products.map(p => ({
    id: p._id,
    text: p.name,
    price: p.price,
    image: p.imageUrl
  }));
}

const PRODUCT_CONTEXTS = {
  sport: {
    benefits: ['énergisant', 'récupération', 'hydratation'],
    types: ['thé vert', 'boisson isotonique', 'smoothie']
  },
  stress: {
    benefits: ['détente', 'relaxant', 'anti-stress'],
    types: ['infusion camomille', 'thé blanc', 'latte matcha']
  },
  fatigue: {
    benefits: ['énergisant', 'revitalisant', 'stimulant'],
    types: ['café noir', 'thé noir', 'maté']
  }
};

// Nouveau: Détection du contexte utilisateur
async function detectUserContext(message, userId) {
  const lowerMsg = message.toLowerCase();
  
  // Détection basée sur le message
  const contexts = [];
  if (/sport|entrain|exercice|foot|jogging|course|gym/i.test(lowerMsg)) {
    contexts.push('sport');
  }
  if (/stress|anxiété|nerveux|tendu|angoisse/i.test(lowerMsg)) {
    contexts.push('stress');
  }
  if (/fatigu|épuis|sommeil|dormir|éner/i.test(lowerMsg)) {
    contexts.push('fatigue');
  }
  
  // Si aucun contexte détecté, essayer de deviner en fonction de l'historique
  if (contexts.length === 0) {
    const lastChat = await Chat.findOne({ userId }).sort({ updatedAt: -1 });
    if (lastChat?.context) {
      if (lastChat.context.lastActivity) contexts.push(lastChat.context.lastActivity);
      if (lastChat.context.mood) contexts.push(lastChat.context.mood);
    }
  }
  
  return contexts;
}

// Nouveau: Recommandation de produits par contexte
async function recommendProductsByContext(contexts) {
  if (!contexts || contexts.length === 0) return [];
  
  const matchedBenefits = [];
  const matchedTypes = [];
  
  contexts.forEach(ctx => {
    if (PRODUCT_CONTEXTS[ctx]) {
      matchedBenefits.push(...PRODUCT_CONTEXTS[ctx].benefits);
      matchedTypes.push(...PRODUCT_CONTEXTS[ctx].types);
    }
  });
  
  // Recherche des produits correspondants
  const products = await Product.find({
    $or: [
      { benefits: { $in: matchedBenefits } },
      { name: { $in: matchedTypes } },
      { category: { $in: contexts } }
    ]
  }).limit(5);
  
  return products;
}

// Réponses du bot
const BOT_RESPONSES = {
  greetings: [
    "Bonjour ! Comment puis-je vous aider aujourd'hui ? ☕",
    "Salut ! Prêt à découvrir nos délicieuses boissons ? 😊",
    "Hey ! Envie d'un bon café ou d'un conseil ? 👋"
  ],
  products: async (contexts) => {
    try {
      if (contexts && contexts.length > 0) {
        const products = await recommendProductsByContext(contexts);
        if (products.length > 0) {
          const contextNames = {
            sport: "après une séance de sport",
            stress: "pour vous détendre",
            fatigue: "pour vous revitaliser"
          };
          
          const contextStr = contexts.map(c => contextNames[c] || c).join(' ou ');
          return {
            text: `Je vous recommande ces produits ${contextStr} : ${products.map(p => p.name).join(', ')}.`,
            products
          };
        }
      }
      
      // Fallback aux produits populaires
      const popularProducts = await Product.find({ isPopular: true }).limit(3);
      return {
        text: `Je vous recommande : ${popularProducts.map(p => p.name).join(', ')}.`,
        products: popularProducts
      };
    } catch (err) {
      console.error('Error fetching products:', err);
      return { text: "Je peux vous recommander nos spécialités du moment !" };
    }
  },
  menu: "Voici notre menu : Café Arabica (15DH), Thé Vert (10DH), Cappuccino (18DH)... Voulez-vous plus de détails ?",
  hours: "Nous sommes ouverts du lundi au vendredi de 8h à 20h, et le weekend de 9h à 18h.",
  default: "Désolé, je n'ai pas compris. Voici ce que je peux faire :\n- Vous conseiller sur nos produits\n- Vous donner nos horaires\n- Vous aider à passer commande"
};

exports.chatWithBot = async (req, res) => {
  try {
    // Validation des entrées
    const { userId, message } = req.body;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false,
        error: 'ID utilisateur invalide'
      });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Message vide ou invalide'
      });
    }

    // Vérification de l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Sauvegarde du message utilisateur
    const userMessage = {
      content: message.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    await Chat.findOneAndUpdate(
      { userId },
      { 
        $push: { messages: userMessage },
        $set: { updatedAt: new Date() }
      },
      { upsert: true, new: true }
    );

    // Génération de la réponse
    const lowerMsg = message.toLowerCase();
    let response;

    if (/bonjour|salut|coucou|hey|hello/i.test(lowerMsg)) {
      response = BOT_RESPONSES.greetings[
        Math.floor(Math.random() * BOT_RESPONSES.greetings.length)
      ];
    } 
    else if (/produit|boisson|cafe|thé|menu|conseil/i.test(lowerMsg)) {
      response = await BOT_RESPONSES.products();
    }
    else if (/heure|horaire|ouvert|fermé/i.test(lowerMsg)) {
      response = BOT_RESPONSES.hours;
    }
    else if (/commande|acheter|panier/i.test(lowerMsg)) {
      response = "Pour commander, ajoutez des produits à votre panier via notre application !";
    }
    else {
      response = BOT_RESPONSES.default;
    }

    // Sauvegarde réponse du bot
    const botMessage = {
      content: response,
      sender: 'bot',
      timestamp: new Date()
    };

    await Chat.findOneAndUpdate(
      { userId },
      { 
        $push: { messages: botMessage },
        $set: { updatedAt: new Date() }
      }
    );

    // Envoi de la réponse
    res.status(200).json({
      success: true,
      response: {
        text: response,
        suggestions: await getSuggestions(lowerMsg)
      }
    });

  } catch (err) {
    console.error('Erreur chatbot:', {
      message: err.message,
      stack: err.stack,
      timestamp: new Date()
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Erreur interne du serveur',
      details: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        stack: err.stack
      } : undefined
    });
  }
};

// controllers/chatController.js
exports.getSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const products = await Product.find({
      name: { $regex: query, $options: 'i' }
    }).limit(5);

    const suggestions = products.map(p => ({
      id: p._id,
      text: p.name,
      price: p.price,
      image: p.imageUrl
    }));

    res.json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: 'Erreur de recherche'
    });
  }
};
// controllers/chatController.js
exports.getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false,
        error: 'ID utilisateur invalide'
      });
    }

    const chat = await Chat.findOne({ userId })
      .sort({ updatedAt: -1 })
      .select('messages createdAt updatedAt');

    if (!chat) {
      return res.json({ 
        success: true,
        chat: { messages: [] } 
      });
    }

    res.json({
      success: true,
      chat: {
        messages: chat.messages,
        lastUpdated: chat.updatedAt
      }
    });

  } catch (err) {
    console.error('Erreur récupération historique:', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date()
    });
    res.status(500).json({ 
      success: false,
      error: 'Erreur de récupération',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// controllers/chatController.js
exports.clearChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    await Chat.deleteMany({ userId });

    res.json({
      success: true,
      message: 'Historique de chat effacé'
    });

  } catch (err) {
    console.error('Erreur suppression historique:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la suppression'
    });
  }
};