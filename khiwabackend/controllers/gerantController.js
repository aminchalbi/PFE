const Product = require('../models/Product');
const Ingredient = require('../models/Ingredient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Salon = require('../models/Salon');
const Order = require('../models/Order'); 
const Offer = require('../models/Offer'); 
/*const Category = require('../models/Category');*/
const mongoose = require('mongoose'); // Ajoutez cette ligne au début du fichier
const Review = require('../models/Review'); 
const Category = require('../models/Category');
// Connexion d'un gerant
const loginGerant = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Rechercher un gérant par email
    const user = await User.findOne({ email, role: 'gerant' });
    if (!user) {
      return res.status(400).send({ error: 'Identifiants incorrects' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ error: 'Identifiants incorrects' });
    }

    // Générer un token JWT
    const token = jwt.sign({ _id: user._id }, 'secretkey');
    user.tokens = user.tokens.concat({ token }); // Ajouter le token
    await user.save();

    res.send({ user, token });
  } catch (err) {
    res.status(400).send(err);
  }
};



const getSalon = async (req, res) => {
  const gerantId = req.user._id;

  try {
    const salon = await Salon.findOne({ gerant: gerantId }).populate('gerant');
    if (!salon) {
      return res.status(404).send({ error: 'Aucun salon trouvé pour ce gérant.' });
    }

    // Renvoyer explicitement si le salon est actif
    res.send({ 
      salon,
      isActive: salon.status === 'approved' 
    });
  } catch (err) {
    res.status(400).send(err);
  }
};

// Ajouter un produit
const addProduct = async (req, res) => {
  try {
    // Convertir les ingrédients si envoyés comme string
    let ingredients = [];
    if (req.body.ingredients) {
      ingredients = typeof req.body.ingredients === 'string' 
        ? JSON.parse(req.body.ingredients)
        : req.body.ingredients;


        if (Array.isArray(ingredients)) {
          ingredients = ingredients.map(id => ({
            ingredient: id,
            quantity: 1 // Valeur par défaut, à adapter selon vos besoins
          }));
        }
      
    }

    // Valider chaque ingrédient
    for (const ing of ingredients) {
      if (!mongoose.Types.ObjectId.isValid(ing.ingredient)) {
        return res.status(400).json({ error: `ID d'ingrédient invalide: ${ing.ingredient}` });
      }
    }
    let imageUrl = '';
    if (req.file) {
      imageUrl = `http://192.168.80.153:3000/uploads/${req.file.filename}`;
    }
    // Créer le produita
    const product = new Product({
      ...req.body,
      ingredients,
      salon: req.user.salonId
    });

    await product.save();
    res.status(201).json({ product });

  } catch (err) {
    console.error('Erreur addProduct:', err);
    res.status(400).json({ error: err.message });
  }
};

// Récupérer tous les produits d'un salon
const getProducts = async (req, res) => {
  const { category } = req.query; 
  try {
    const products = await Product.find({ salon: req.user.salonId }).populate('ingredients.ingredient')
    ;
    res.status(200).json(products);
  } catch (err) {
    console.error('Erreur lors de la récupération des produits:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


// Modifier un produit
const updateProduct = async (req, res) => {
  const { productId } = req.params;
  const { name, description, price, ingredients } = req.body;

  try {
    // Convertir les ingrédients comme dans addProduct
    let formattedIngredients = [];
    if (ingredients) {
      formattedIngredients = typeof ingredients === 'string' 
        ? JSON.parse(ingredients)
        : ingredients;

      if (Array.isArray(formattedIngredients)) {
        formattedIngredients = formattedIngredients.map(id => ({
          ingredient: id,
          quantity: 1 // Même valeur par défaut que dans addProduct
        }));
      }

      // Valider chaque ingrédient
      for (const ing of formattedIngredients) {
        if (!mongoose.Types.ObjectId.isValid(ing.ingredient)) {
          return res.status(400).json({ error: `ID d'ingrédient invalide: ${ing.ingredient}` });
        }
      }
    }

    // Préparer les données de mise à jour
    const updateData = {
      name,
      description,
      price,
      ingredients: formattedIngredients
    };

    // Gérer l'image si elle est mise à jour
    if (req.file) {
      updateData.image = `http://192.168.80.153:3000/uploads/${req.file.filename}`;
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    ).populate('ingredients.ingredient');

    if (!product) {
      return res.status(404).send({ error: 'Produit non trouvé' });
    }

    res.send({ product });
  } catch (err) {
    console.error('Erreur updateProduct:', err);
    res.status(400).send({ error: err.message });
  }
};

// Supprimer un produit
const deleteProduct = async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).send({ error: 'Produit non trouvé' });
    }

    res.send({ message: 'Produit supprimé avec succès' });
  } catch (err) {
    res.status(400).send(err);
  }
};

// Ajouter un ingrédient
const addIngredient = async (req, res) => {
  const { name, quantity, unit, salonId } = req.body;

  try {
    const ingredient = new Ingredient({
      name,
      quantity,
      unit,
      salon: req.user.salonId
    });

    await ingredient.save();
    res.status(201).send({ ingredient });
  } catch (err) {
    res.status(400).send(err);
  }
};

// Récupérer tous les ingrédients d'un salon
/*const getIngredients = async (req, res) => {
  try {
    // Utiliser req.user.salonId au lieu de req.query.salonId
    const ingredients = await Ingredient.find({ salon: req.user.salonId });
    res.send({ ingredients });
  } catch (err) {
    console.error('Error fetching ingredients:', err);
    res.status(500).send({ error: 'Erreur serveur' });
  }
};*/

// Mettre à jour la quantité d'un ingrédient
const updateIngredient = async (req, res) => {
  const { ingredientId } = req.params;
  const { name, quantity, unit } = req.body;

  try {
    const ingredient = await Ingredient.findByIdAndUpdate(
      ingredientId,
      { name, quantity, unit },
      { new: true }
    );

    if (!ingredient) {
      return res.status(404).send({ error: 'Ingrédient non trouvé' });
    }

    res.send({ ingredient });
  } catch (err) {
    res.status(400).send(err);
  }
};
const getOrders = async (req, res) => {
  try {
    // 1. Trouver le salon associé au gérant
    const salon = await Salon.findOne({ gerant: req.user._id });
    if (!salon) {
      return res.status(404).json({ error: "Aucun salon trouvé pour ce gérant" });
    }

    // 2. Récupérer les commandes NON annulées du salon
    const orders = await Order.find({ 
      salon: salon._id,
      isCancelled: { $ne: true } // Exclure les commandes annulées
    })
      .populate('products.product')
      .populate('client', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Erreur getOrders:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
// Ajoutez cette fonction pour les statistiques quotidiennes
const getDailyRevenue = async (req, res) => {
  try {
    console.log("Début de getDailyRevenue");
    
    // 1. Trouver le salon
    const salon = await Salon.findOne({ gerant: req.user._id });
    if (!salon) {
      return res.status(404).json({ 
        success: false,
        error: "Salon non trouvé" 
      });
    }

    // 2. Définir la période du jour
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    console.log("Période du jour:", todayStart, "à", todayEnd);

    // 3. Récupérer les commandes du jour
    const todaysOrders = await Order.find({
      salon: salon._id,
      createdAt: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['completed', 'delivered'] },
        isCancelled: { $ne: true } 
    }).lean();

    console.log(`Commandes aujourd'hui: ${todaysOrders.length}`);

    // 4. Calculer le revenu
    const revenue = todaysOrders.reduce((total, order) => {
      return total + (order.total || 0); // Utilisez 'total' au lieu de 'totalAmount'
    }, 0);

    res.status(200).json({
      success: true,
      revenue,
      orderCount: todaysOrders.length,
      todaysOrders: todaysOrders.map(order => ({
        ...order,
        orderNumber: order._id.toString().slice(-6).toUpperCase()
      }))
    });

  } catch (error) {
    console.error("Erreur getDailyRevenue:", error);
    res.status(500).json({ 
      success: false,
      error: "Erreur serveur lors du calcul du revenu" 
    });
  }
};
const updateOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    res.send({ order });
  } catch (err) {
    res.status(400).send(err);
  }
};

// Supprimer un ingrédient
const deleteIngredient = async (req, res) => {
  const { ingredientId } = req.params;

  try {
    const ingredient = await Ingredient.findByIdAndDelete(ingredientId);

    if (!ingredient) {
      return res.status(404).send({ error: 'Ingrédient non trouvé' });
    }

    res.send({ message: 'Ingrédient supprimé avec succès' });
  } catch (err) {
    res.status(400).send(err);
  }
};
// Créer un comptoiriste
const assignRoles = async (req, res) => {
  const { username, email, password, role, salonId } = req.body;
  const gerantId = req.user._id; // ID du gérant connecté

  try {
    // Vérifier si le gérant est associé au salon
    const salon = await Salon.findOne({ _id: salonId, gerant: gerantId });
    if (!salon) {
      return res.status(403).send({ error: 'Vous n\'êtes pas autorisé à assigner un rôle pour ce salon.' });
    }

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });

    if (!user) {
      // Créer un nouvel utilisateur avec le rôle spécifié
      user = new User({
        username,
        email,
        password,
        role,
        salon: salonId,
      });
    } else {
      // Mettre à jour le rôle de l'utilisateur existant
      user.role = role;
      user.salon = salonId;
    }

    await user.save();
    res.status(201).send({ user });
  } catch (err) {
    res.status(400).send(err);
  }
};

const getStatistics = async (req, res) => {
  try {
    const productsCount = await Product.countDocuments();
    const ingredientsCount = await Ingredient.countDocuments();
    const ordersCount = await Order.countDocuments();
    res.send({ productsCount, ingredientsCount, ordersCount });
  } catch (err) {
    res.status(400).send(err);
  }
};

// Activer/désactiver un utilisateur
const getComptoiristes = async (req, res) => {
  try {
    const comptoiristes = await User.find({ salon: req.user.salonId, role: 'comptoiriste' });
    res.status(200).json(comptoiristes);
  } catch (err) {
    console.error('Erreur lors de la récupération des comptoiristes:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un comptoiriste
const createComptoiriste = async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ error: 'Un utilisateur avec cet email existe déjà.' });
    }

    // Récupérer le salon du gérant connecté
    const salon = await Salon.findOne({ gerant: req.user._id });
    if (!salon) {
      return res.status(400).send({ error: 'Aucun salon trouvé pour ce gérant.' });
    }

    const comptoiriste = new User({
      username,
      email,
      password,
      role: 'comptoiriste',
      salon: salon._id, // Associer automatiquement au salon du gérant
    });

    await comptoiriste.save();
    res.status(201).send({ comptoiriste });
  } catch (err) {
    console.error('Erreur lors de la création du comptoiriste:', err);
    res.status(500).send({ error: 'Erreur serveur lors de la création du comptoiriste.' });
  }
};



// Mettre à jour un comptoiriste
const updateComptoiriste = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const gerantId = req.user._id;

  try {
    // Vérifier que le comptoiriste appartient au salon du gérant
    const salon = await Salon.findOne({ gerant: gerantId });
    if (!salon) {
      return res.status(403).send({ error: 'Accès non autorisé' });
    }

    const comptoiriste = await User.findOne({ 
      _id: id, 
      salon: salon._id,
      role: 'comptoiriste'
    });

    if (!comptoiriste) {
      return res.status(404).send({ error: 'Comptoiriste non trouvé' });
    }

    // Si le mot de passe est fourni, le hacher
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 8);
    }

    const updatedComptoiriste = await User.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    );

    res.send({ 
      comptoiriste: updatedComptoiriste,
      message: 'Comptoiriste mis à jour avec succès'
    });
  } catch (err) {
    res.status(400).send(err);
  }
};
// Activer/désactiver un comptoiriste
const toggleComptoiristeStatus = async (req, res) => {
  try {
    const { userId, isActive } = req.body;
    const comptoiriste = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    );
    res.status(200).json(comptoiriste);
  } catch (err) {
    console.error('Erreur lors de la mise à jour du statut du comptoiriste:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ error: 'Aucun fichier téléversé.' });
    }

    // Renvoyer l'URL de l'image téléversée
    const imageUrl = `http://192.168.80.153:3000/uploads/${req.file.filename}`;
    res.send({ imageUrl });
  } catch (err) {
    res.status(400).send({ error: 'Erreur lors du téléversement de l\'image.' });
  }
};



// Récupérer les avis des produits du salon
const getProductReviews = async (req, res) => {
  try {
    // 1. Trouver le salon du gérant connecté
    const salon = await Salon.findOne({ gerant: req.user._id });
    if (!salon) {
      return res.status(404).json({ 
        success: false,
        error: "Aucun salon trouvé pour ce gérant" 
      });
    }

    // 2. Récupérer les avis avec les produits et clients associés
    const reviews = await Review.find({ salon: salon._id })
      .populate({
        path: 'product',
        select: 'name image price',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .populate({
        path: 'client',
        select: 'username profile',
        populate: {
          path: 'profile',
          select: 'image'
        }
      })
      .sort({ createdAt: -1 }) // Du plus récent au plus ancien
      .lean();

    // 3. Formater les données pour le frontend
    const formattedReviews = reviews.map(review => ({
      ...review,
      product: review.product || { name: 'Produit supprimé' },
      client: review.client || { username: 'Anonyme' },
      rating: Number(review.rating),
      date: review.createdAt.toLocaleDateString('fr-FR')
    }));

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating: salon.averageRating || 0,
      reviews: formattedReviews
    });

  } catch (err) {
    console.error('Erreur getProductReviews:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Récupérer les statistiques des avis du salon
const getSalonReviews = async (req, res) => {
  try {
    // 1. Trouver le salon du gérant
    const salon = await Salon.findOne({ gerant: req.user._id });
    if (!salon) {
      return res.status(404).json({ error: 'Salon non trouvé' });
    }

    // 2. Calculer la moyenne des notes
    const stats = await Review.aggregate([
      { $match: { salon: salon._id } },
      { 
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingCounts: {
            $push: {
              rating: "$rating",
              count: 1
            }
          }
        }
      },
      {
        $project: {
          averageRating: { $round: ["$averageRating", 1] },
          totalReviews: 1,
          ratingDistribution: {
            $reduce: {
              input: "$ratingCounts",
              initialValue: [0, 0, 0, 0, 0], // [1-star, 2-star, 3-star, 4-star, 5-star]
              in: {
                $let: {
                  vars: {
                    index: { $subtract: ["$$this.rating", 1] },
                    currentValue: "$$value"
                  },
                  in: {
                    $concatArrays: [
                      { $slice: ["$$currentValue", 0, "$$index"] },
                      [{ $add: [{ $arrayElemAt: ["$$currentValue", "$$index"] }, 1] }],
                      { $slice: ["$$currentValue", { $add: ["$$index", 1] }, 5] }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      averageRating: stats[0]?.averageRating || 0,
      totalReviews: stats[0]?.totalReviews || 0,
      ratingDistribution: stats[0]?.ratingDistribution || [0, 0, 0, 0, 0]
    });
  } catch (err) {
    console.error('Erreur getSalonReviews:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: err.message 
    });
  }
};
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Le nom de la catégorie est requis' });
    }

    // Construction de l'URL complète de l'image
    const imageUrl = req.file 
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : '';

    const category = new Category({
      name,
      description: description || '',
      image: imageUrl,
      salon: req.user.salonId
    });

    await category.save();

    // Renvoyer toutes les données formatées
    res.status(201).json({
      _id: category._id,
      name: category.name,
      description: category.description,
      image: category.image,
      salon: category.salon,
      createdAt: category.createdAt
    });
  } catch (err) {
    console.error('Erreur createCategory:', err);
    res.status(400).json({ error: err.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ salon: req.user.salonId });
    
    // Transformez les données pour inclure l'URL complète de l'image
    const categoriesWithFullImageUrl = categories.map(category => ({
      ...category._doc,
      image: category.image 
        ? `${req.protocol}://${req.get('host')}${category.image.replace('uploads', '/uploads')}`
        : null
    }));

    res.json(categoriesWithFullImageUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour une catégorie
const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    const updateData = { 
      name,
      description: description || '' 
    };
    
    if (req.file) {
      updateData.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    const category = await Category.findByIdAndUpdate(
      categoryId,
      updateData,
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    res.json({
      _id: category._id,
      name: category.name,
      description: category.description,
      image: category.image,
      salon: category.salon
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Supprimer une catégorie
const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Vérifier si des produits utilisent cette catégorie
    const productsCount = await Product.countDocuments({ category: categoryId });
    if (productsCount > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer : des produits sont associés à cette catégorie' 
      });
    }

    const category = await Category.findByIdAndDelete(categoryId);
    
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const deleteComptoiriste = async (req, res) => {
  const { id } = req.params;
  const gerantId = req.user._id;

  try {
    // Vérifier que le gérant ne peut pas se supprimer lui-même
    if (id === gerantId.toString()) {
      return res.status(400).send({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Vérifier que le comptoiriste appartient bien au salon du gérant
    const salon = await Salon.findOne({ gerant: gerantId });
    if (!salon) {
      return res.status(403).send({ error: 'Accès non autorisé' });
    }

    const comptoiriste = await User.findOne({ _id: id, salon: salon._id, role: 'comptoiriste' });
    if (!comptoiriste) {
      return res.status(404).send({ error: 'Comptoiriste non trouvé ou non autorisé' });
    }

    await User.findByIdAndDelete(id);
    res.send({ message: 'Comptoiriste supprimé avec succès' });
  } catch (err) {
    console.error('Erreur deleteComptoiriste:', err);
    res.status(500).send({ error: 'Erreur serveur' });
  }
};

// Dans gerantController.js

// Configuration des seuils d'alerte
const STOCK_ALERT_THRESHOLDS = {
  'kg': 5,
  'g': 5000, // 5kg en grammes
  'L': 10,
  'mL': 10000, // 10L en mL
  'unité': 10
};

// Modifier getIngredients pour inclure les alertes
const getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({ salon: req.user.salonId });
    
    // Ajouter le statut d'alerte pour chaque ingrédient
    const ingredientsWithAlerts = ingredients.map(ingredient => {
      const threshold = STOCK_ALERT_THRESHOLDS[ingredient.unit] || 0;
      const isLowStock = ingredient.quantity <= threshold;
      
      return {
        ...ingredient.toObject(),
        isLowStock,
        alertThreshold: threshold
      };
    });

    res.send({ ingredients: ingredientsWithAlerts });
  } catch (err) {
    console.error('Error fetching ingredients:', err);
    res.status(500).send({ error: 'Erreur serveur' });
  }
};

// Endpoint pour les ingrédients critiques
const getCriticalIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({ salon: req.user.salonId });
    
    const criticalIngredients = ingredients.filter(ingredient => {
      const threshold = STOCK_ALERT_THRESHOLDS[ingredient.unit] || 0;
      return ingredient.quantity <= threshold;
    });

    res.send({ criticalIngredients });
  } catch (err) {
    res.status(500).send({ error: 'Erreur serveur' });
  }
};
// Ajouter/modifier une promotion
const addPromoToProduct = async (req, res) => {
  const { productId } = req.params;
  const { promoPrice, promoLabel, durationInDays } = req.body;

  try {
    // Vérifier que le produit appartient au salon du gérant
    const product = await Product.findOne({
      _id: productId,
      salon: req.user.salonId
    });

    if (!product) {
      return res.status(404).send({ error: 'Produit non trouvé ou non autorisé' });
    }

    // Calculer les dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(durationInDays));

    // Mettre à jour le produit
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        isOnPromo: true,
        promoDetails: {
          promoPrice,
          originalPrice: product.price,
          startDate,
          endDate,
          promoLabel
        }
      },
      { new: true }
    ).populate('category').populate('ingredients.ingredient');

    res.send({ product: updatedProduct });
  } catch (err) {
    console.error('Error adding promo:', err);
    res.status(400).send({ error: err.message });
  }
};

// Supprimer une promotion
const removePromoFromProduct = async (req, res) => {
  const { productId } = req.params;

  try {
    // Vérifier que le produit appartient au salon du gérant
    const product = await Product.findOne({
      _id: productId,
      salon: req.user.salonId
    });

    if (!product) {
      return res.status(404).send({ error: 'Produit non trouvé ou non autorisé' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        isOnPromo: false,
        price: product.promoDetails?.originalPrice || product.price,
        $unset: { promoDetails: 1 }
      },
      { new: true }
    ).populate('category').populate('ingredients.ingredient');

    res.send({ product: updatedProduct });
  } catch (err) {
    console.error('Error removing promo:', err);
    res.status(400).send({ error: err.message });
  }
};
// Récupérer les produits en promotion
const getPromoProducts = async (req, res) => {
  try {
    const products = await Product.find({
      salon: req.user.salonId,
      isOnPromo: true,
      'promoDetails.endDate': { $gt: new Date() }
    });
    res.send({ products });
  } catch (err) {
    res.status(400).send(err);
  }
};
// controllers/gerantController.js

// Créer une offre
const createOffer = async (req, res) => {
  try {
    const { name, description, products, price, endDate } = req.body;
    
    // Validation
    if (!name || !products || !price) {
      return res.status(400).json({ error: 'Nom, produits et prix sont obligatoires' });
    }

    const offer = new Offer({
      name,
      description,
      products,
      price,
      endDate,
      salon: req.user.salonId
    });

    await offer.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Offre créée avec succès',
      offer
    });

  } catch (err) {
    console.error('Erreur createOffer:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer toutes les offres du salon
const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ salon: req.user.salonId })
      .populate('products.product')
      .sort({ createdAt: -1 });

    res.json({ success: true, offers });
  } catch (err) {
    console.error('Erreur getOffers:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mettre à jour une offre
const updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const updates = req.body;

    const offer = await Offer.findOneAndUpdate(
      { _id: offerId, salon: req.user.salonId },
      updates,
      { new: true }
    ).populate('products.product');

    if (!offer) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }

    res.json({ 
      success: true,
      message: 'Offre mise à jour avec succès',
      offer
    });
  } catch (err) {
    console.error('Erreur updateOffer:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer une offre
const deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    const offer = await Offer.findOneAndDelete({
      _id: offerId,
      salon: req.user.salonId
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }

    res.json({ 
      success: true,
      message: 'Offre supprimée avec succès'
    });
  } catch (err) {
    console.error('Erreur deleteOffer:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Vérifier les promotions expirées (à exécuter périodiquement)
const checkExpiredPromos = async () => {
  try {
    const expiredPromos = await Product.find({
      isOnPromo: true,
      'promoDetails.endDate': { $lte: new Date() }
    });

    for (const product of expiredPromos) {
      await Product.findByIdAndUpdate(product._id, {
        isOnPromo: false,
        price: product.promoDetails.originalPrice,
        promoDetails: null
      });
    }
  } catch (err) {
    console.error('Error checking expired promos:', err);
  }
};

// Planifiez cette fonction pour s'exécuter quotidiennement
setInterval(checkExpiredPromos, 24 * 60 * 60 * 1000); // Tous les jours

module.exports = {
  updateOrderStatus,
  getCriticalIngredients,
checkExpiredPromos,
  loginGerant,
  deleteComptoiriste ,
  addProduct,
  getProducts,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
getPromoProducts,
  updateProduct,
  deleteProduct,
  getProductReviews,
  getSalonReviews,
  addIngredient,
  getIngredients,
  updateIngredient,
  deleteIngredient,
  getOrders,
  getStatistics,
  getSalon,
  assignRoles,
  getDailyRevenue,
 removePromoFromProduct,
  getComptoiristes,
  uploadImage,
  toggleComptoiristeStatus,
  createComptoiriste,
  updateComptoiriste,
  addPromoToProduct,
  deleteOffer,
  updateOffer,
  getOffers,
  createOffer,
};