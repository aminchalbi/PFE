
const Product = require('../models/Product');
const Ingredient = require('../models/Ingredient');
const { sendNotification } = require('../utils/notification');

const Order = require('../models/Order');

const User = require('../models/User');
const Salon = require('../models/Salon');
const Notification = require('../models/Notification');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



const loginComptoiriste = async (req, res) => {
  const { email, password } = req.body;

  console.log("Données reçues:", { email, password }); // Log les données reçues

  try {
    // Vérifier que l'email et le mot de passe sont fournis
    if (!email || !password) {
      console.log("Email ou mot de passe manquant");
      return res.status(400).send({ error: 'Veuillez fournir un email et un mot de passe.' });
    }

    // Rechercher un utilisateur avec le rôle "comptoiriste"
    const user = await User.findOne({ email, role: 'comptoiriste' });
    if (!user) {
      console.log("Utilisateur non trouvé");
      return res.status(400).send({ error: 'Identifiants incorrects.' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Mot de passe incorrect");
      return res.status(400).send({ error: 'Identifiants incorrects.' });
    }

    // Générer un token JWT
    const token = jwt.sign({ _id: user._id }, 'secretkey');
    user.tokens = user.tokens.concat({ token });
    await user.save();

    console.log("Connexion réussie:", { user, token }); // Log la réponse réussie
    res.send({ user, token });
  } catch (err) {
    console.log("Erreur lors de la connexion:", err.message); // Log l'erreur
    res.status(400).send({ error: 'Une erreur est survenue lors de la connexion.' });
  }
};




// Récupérer les commandes du salon

// Mettre à jour le statut d'une commande
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'ready', 'delivered'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    // 1. Mettre à jour la commande
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('client');

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    // 2. Envoyer une notification au client
    const notification = new Notification({
      user: order.client._id,
      message: `Votre commande #${order._id} est maintenant ${status}`
    });
    await notification.save();

    // 3. Répondre avec la commande mise à jour
    res.json({ 
      success: true, 
      order,
      message: 'Statut mis à jour avec succès' 
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les clients récents (pour démo)
// Récupérer les commandes avec statistiques
// Ajoutez cette méthode pour filtrer les commandes non annulées
const getOrders = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        error: 'Comptoiriste non associé à un salon'
      });
    }

    // Modifiez la requête pour exclure les commandes annulées
    const orders = await Order.find({ 
      salon: salonId,
      isCancelled: { $ne: true } // Ne pas inclure les commandes annulées
    })
    .populate('client', 'username phone')
    .populate('products.product', 'name price')
    .sort({ createdAt: -1 });

    // Modifiez également l'agrégation pour les statistiques
    const stats = await Order.aggregate([
      { 
        $match: { 
          salon: salonId,
          isCancelled: { $ne: true } // Exclure les annulées des stats
        } 
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total: { $sum: "$total" }
        }
      }
    ]);

    // Même chose pour les commandes des 7 derniers jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyOrders = await Order.aggregate([
      {
        $match: {
          salon: salonId,
          createdAt: { $gte: sevenDaysAgo },
          isCancelled: { $ne: true }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  const formattedOrders = orders.map(order => ({
      ...order.toObject(),
      products: order.products.map(item => ({
        ...item.toObject(),
        // Utiliser item.price (déjà correct) au lieu de item.product.price
        price: item.price,
        product: {
          name: item.product?.name,
          _id: item.product?._id
        }
      }))
    }));

    res.json({
      success: true,
      count: orders.length,
      orders,
      stats,
      dailyOrders
    });

  } catch (error) {
    console.error('Erreur getOrders:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};
// Récupérer les clients récents avec nombre de commandes
const getRecentClients = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    
    if (!salonId) {
      return res.status(400).json({
        success: false,
        error: 'Association salon requise'
      });
    }

    const clients = await Order.aggregate([
      { $match: { salon: salonId } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$client" } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'client'
        }
      },
      { $unwind: '$client' },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'client',
          as: 'clientOrders'
        }
      },
      {
        $project: {
          _id: 1,
          username: '$client.username',
          phone: '$client.phone',
          orderCount: { $size: '$clientOrders' },
          lastOrder: { $max: '$clientOrders.createdAt' }
        }
      }
    ]);

    res.json({
      success: true,
      clients
    });

  } catch (error) {
    console.error('Erreur getRecentClients:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
};
const getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({ salon: req.user.salonId });
    res.send({ ingredients });
  } catch (err) {
    res.status(500).send({ error: 'Erreur serveur' });
  }
};

// Mettre à jour les stocks après utilisation
// Backend - comptoiristeController.js
const updateIngredientsStock = async (req, res) => {
  try {
    const { orderId, usedIngredients } = req.body; // Ajout de orderId
    
    if (!Array.isArray(usedIngredients)) {
      return res.status(400).send({ error: 'Format des données invalide' });
    }

    const updateOperations = usedIngredients.map(async ({ ingredientId, quantityUsed }) => {
      const ingredient = await Ingredient.findOne({ 
        _id: ingredientId, 
        salon: req.user.salonId // Vérification du salon
      });
      
      if (!ingredient) {
        throw new Error(`Ingrédient ${ingredientId} non trouvé`);
      }
      
      if (ingredient.quantity < quantityUsed) {
        throw new Error(`Stock insuffisant pour ${ingredient.name}`);
      }
      
      ingredient.quantity -= quantityUsed;
      return ingredient.save();
    });

    await Promise.all(updateOperations);
    
    res.send({ 
      success: true, 
      message: 'Stocks mis à jour avec succès',
      orderId // Retourner l'ID de commande
    });
  } catch (err) {
    res.status(400).send({ 
      success: false,
      error: err.message 
    });
  }
};
const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client', 'username')
      .populate('products.product', 'name price')
      .populate('products.ingredients.ingredient', 'name quantity unit');

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Et ajoutez la route dans routes/comptoiristeRoutes.js:


module.exports = {
  loginComptoiriste,
  getIngredients,
  updateIngredientsStock,
  getOrders,
  updateOrderStatus,
  getRecentClients,
  getOrderDetails
 
};