const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Salon = require('../models/Salon');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Offer = require('../models/Offer');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Category = require('../models/Category');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerClient = async (req, res) => {
  const { username, password, firstName, lastName, email, phone } = req.body;

  try {
    const user = new User({
      username,
      password,
      email,
      role: 'client',
      profile: {
        firstName,
        lastName,
       
        phone,
      },
    });

    await user.save();
    res.status(201).send({ user });
  } catch (err) {
    res.status(400).send(err);
  }
};

const loginClient = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, role: 'client' });
    if (!user) {
      return res.status(400).send({ error: 'Nom d\'utilisateur incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ error: 'Mot de passe incorrect' });
    }

    const token = jwt.sign({ _id: user._id }, 'secretkey');
    user.tokens = user.tokens.concat({ token });
    await user.save();

    res.send({ user, token });
  } catch (err) {
    res.status(500).send({ error: 'Erreur serveur' });
  }
};


const placeOrder = async (req, res) => {
  try {
    const { cartItems, salonId, tableNumber } = req.body;
    const clientId = req.user._id;

    console.log("[DEBUG] Reçu:", { cartItems, salonId, tableNumber }); // ← LOG

    // 1. Validation obligatoire
    if (!cartItems?.length || !salonId || !tableNumber) {
      return res.status(400).json({ error: "Données manquantes" });
    }

    // 2. Calculer le total (avec vérification du prix)
    const total = cartItems.reduce((sum, item) => {
      if (!item.price) throw new Error("Prix manquant pour: " + item.product);
      return sum + (item.price * item.quantity);
    }, 0);

    // 3. Créer la commande
    const order = new Order({
      client: clientId,
      products: cartItems.map(item => ({
        product: item.product,  // ID du produit
        quantity: item.quantity,
        price: item.price       // Prix du panier (promo/normal)
      })),
      salon: salonId,
      total,
      tableNumber,
      status: "pending"
    });

    await order.save();
    await User.findByIdAndUpdate(clientId, { $set: { cart: [] } });

    console.log("[DEBUG] Commande enregistrée:", order); // ← LOG

    res.status(201).json({ 
      success: true,
      order,
      message: "Commande passée avec succès"
    });

  } catch (err) {
    console.error("[ERREUR] placeOrder:", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};
const getNotifications = async (req, res) => {
  const userId = req.user._id;

  try {
    const notifications = await Notification.find({ user: userId });
    res.send({ notifications });
  } catch (err) {
    res.status(400).send(err);
  }
};
const getOrderHistory = async (req, res) => {
  const userId = req.user._id;

  try {
    const orders = await Order.find({ client: userId })
      .populate('products.product')
      .populate('salon')
      .sort({ createdAt: -1 });

    // Formater les données pour inclure le statut d'annulation
    const formattedOrders = orders.map(order => ({
      ...order.toObject(),
      canCancel: order.status === 'pending' && !order.isCancelled
    }));

    res.send({ orders: formattedOrders });
  } catch (err) {
    res.status(400).send(err);
  }
};
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, email, phone } = req.body;

    const updateData = {
      'profile.firstName': firstName,
      'profile.lastName': lastName,
      'profile.email': email,
      'profile.phone': phone
    };

    if (req.file) {
      // Chemin relatif pour la base de données
      const imagePath = `/uploads/${req.file.filename}`;
      updateData['profile.image'] = imagePath;

      // Suppression ancienne image si elle existe
      const user = await User.findById(userId);
      if (user.profile?.image) {
        const oldPath = path.join(__dirname, '../public', user.profile.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({
      success: true,
      user: updatedUser,
      imageUrl: updatedUser.profile.image 
        ? `${req.protocol}://${req.get('host')}${updatedUser.profile.image}`
        : null
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
const searchSalons = async (req, res) => {
  const { query } = req.query;

  try {
    const salons = await Salon.find({
      $or: [
        { name: { $regex: query, $options: 'i' } }, // Recherche par nom (insensible à la casse)
        { address: { $regex: query, $options: 'i' } }, // Recherche par adresse
      ],
    });
    res.send({ salons });
  } catch (err) {
    res.status(400).send(err);
  }
};
const updateProfileImage = async (req, res) => {
  const userId = req.user._id;
  const imageUrl = req.file ? `http://192.168.80.153/uploads/${req.file.filename}` : null;
/*votre-backend-url.com*/
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { 'profile.image': imageUrl },
      { new: true }
    );
    res.send({ user });
  } catch (err) {
    res.status(400).send(err);
  }
};

const getProductDetails = async (req, res) => {
  const { productId } = req.query;

  if (!productId) {
    return res.status(400).send({ error: 'ID produit requis' });
  }

  try {
    const product = await Product.findById(productId).populate('salon', 'name address');
    
    if (!product) {
      return res.status(404).send({ error: 'Produit non trouvé' });
    }

    res.send({ 
      success: true,
      product: {
        _id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        salon: product.salon,
        isOnPromo: product.isOnPromo, // Ajout du champ isOnPromo
        promoDetails: product.promoDetails
      }
    });
  } catch (err) {
    console.error('Erreur getProductDetails:', err);
    res.status(500).send({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


// Dans votre backend (Node.js)
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // 1. Trouver le produit (avec les infos promo)
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Produit non trouvé" });
    }

    // 2. Déterminer le prix réel (promo ou normal)
    const price = product.isOnPromo ? product.promoDetails.promoPrice : product.price;

    // 3. Mettre à jour le panier
    const user = await User.findById(req.user._id);
    if (!user.cart) user.cart = [];

    const existingItem = user.cart.find(item => item.product.toString() === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = price; // ← Prix corrigé (promo/normal)
    } else {
      user.cart.push({
        product: productId,
        quantity,
        price // ← Stocke le prix réel
      });
    }

    await user.save();

    // 4. Renvoyer le panier avec les produits populés (et leurs prix)
    const userWithCart = await User.findById(req.user._id).populate({
      path: 'cart.product',
      select: 'name image isOnPromo promoDetails' // ← Inclure les infos promo
    });

    res.status(200).json({
      success: true,
      cart: userWithCart.cart.map(item => ({
        ...item.toObject(),
        // Forcer le prix stocké dans le panier (éviter les inconsistances)
        price: item.price 
      }))
    });

  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};
const removeFromCart = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.body;

  try {
    const user = await User.findById(userId);
    user.cart = user.cart.filter((item) => item.product.toString() !== productId);
    await user.save();
    res.send({ user });
  } catch (err) {
    res.status(400).send(err);
  }
};

const getSalons = async (req, res) => {
  try {
    const salons = await Salon.find({ status: 'approved' }).populate('gerant', 'username email');
    res.send({ salons }); // Renvoyer les salons dans un objet { salons: [...] }
  } catch (err) {
    res.status(500).send({ error: 'Erreur serveur lors de la récupération des salons.' });
  }
};


const getProfile = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId)
      .select('-password -tokens')
      .populate('cart.product', 'name price image salon'); // Ajoutez cette ligne
    
    if (!user) {
      return res.status(404).send({ error: 'Utilisateur non trouvé.' });
    }

    // Assurez-vous que cart existe
    if (!user.cart) {
      user.cart = [];
    }

    res.send({ 
      user,
      cart: user.cart // Retournez explicitement le panier
    });
  } catch (err) {
    res.status(500).send({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


// clientController.js
const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Token Google manquant' });
    }

    // Vérifier le token Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload['sub']; // ID unique Google
    const email = payload['email'];
    const firstName = payload['given_name'];
    const lastName = payload['family_name'];
    const picture = payload['picture'];

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email, isGoogleAuth: true });

    if (!user) {
      // Créer un nouvel utilisateur
      user = new User({
        username: email.split('@')[0], // Générer un username à partir de l'email
        email,
        isGoogleAuth: true,
        password: crypto.randomBytes(20).toString('hex'), // Mot de passe aléatoire (non utilisé)
        role: 'client',
        profile: {
          firstName,
          lastName,
          email,
          image: picture,
        },
      });
      await user.save();
    }

    // Générer un token JWT
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'secretkey');
    user.tokens = user.tokens.concat({ token });
    await user.save();

    res.status(200).json({
      success: true,
      user,
      token,
      message: 'Connexion Google réussie',
    });
  } catch (err) {
    console.error('Erreur googleAuth:', err);
    res.status(500).json({
      error: 'Erreur serveur lors de l\'authentification Google',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// Ajouter à module.exports


// Demande de réinitialisation
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ error: 'Aucun utilisateur avec cet email' });
    }

    // Générer un code à 4 chiffres
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Sauvegarder le code et son expiration (15 minutes)
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = Date.now() + 900000; // 15 minutes
    await user.save();

    // Configuration du transporteur SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // Serveur SMTP de Gmail
      port: 587,
      secure: false, // true pour le port 465, false pour les autres ports
      auth: {
        user: process.env.EMAIL_USER, // Votre email Gmail
        pass: process.env.EMAIL_PASSWORD // Votre mot de passe d'application
      },
      tls: {
        rejectUnauthorized: false // Pour éviter les erreurs de certificat en développement
      }
    });

    // Options de l'email
    const mailOptions = {
      from: '"Votre Application" <votre.email@gmail.com>',
      to: email,
      subject: 'Code de réinitialisation de mot de passe',
      text: `Votre code de réinitialisation est : ${resetCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #4a6baf;">Réinitialisation de mot de passe</h2>
          <p>Voici votre code de vérification :</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="margin: 0; color: #4a6baf;">${resetCode}</h1>
          </div>
          <p>Ce code expirera dans 15 minutes.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
        </div>
      `
    };

    // Envoi de l'email
    await transporter.sendMail(mailOptions);
    
    res.send({ 
      message: 'Un code de réinitialisation a été envoyé à votre adresse email',
      // En développement seulement, ne pas envoyer en production
      debugCode: process.env.NODE_ENV === 'development' ? resetCode : undefined
    });

  } catch (err) {
    console.error('Erreur lors de l\'envoi du code:', err);
    res.status(500).send({ 
      error: 'Erreur lors de l\'envoi du code de réinitialisation',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  // Validation minimale
  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).send({ 
      error: 'Token invalide ou mot de passe trop court (min 6 caractères)' 
    });
  }

  try {
    // Recherche l'utilisateur avec le token valide et non expiré
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send({ 
        error: 'Code invalide ou expiré. Veuillez refaire une demande.' 
      });
    }

    // Met à jour le mot de passe
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Sauvegarde en déclenchant le hook de hachage
    await user.save();

    // Réponse de succès
    res.send({ 
      success: true,
      message: 'Mot de passe mis à jour avec succès' 
    });

  } catch (err) {
    console.error('Erreur resetPassword:', err);
    res.status(500).send({ 
      error: 'Erreur lors de la mise à jour du mot de passe',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ 
      email,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send({ error: 'Code invalide ou expiré' });
    }

    // Générer un token temporaire pour la réinitialisation
    const tempToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = tempToken;
    await user.save();

    res.send({ 
      message: 'Code vérifié', 
      tempToken: tempToken 
    });
  } catch (err) {
    res.status(500).send({ error: 'Erreur serveur' });
  }
};


const getProductsBySalon = async (req, res) => {
  const { salonId } = req.query;

  try {
    // Vérifiez que le salon existe
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).send({ error: 'Salon non trouvé' });
    }

    // Récupérez les produits du salon
    const products = await Product.find({ salon: salonId })
    .populate({
      path: 'ingredients.ingredient',
      model: 'Ingredient',
      select: 'name'
    });

    res.send({ products });
  } catch (err) {
    console.error('Erreur getProductsBySalon:', err);
    res.status(500).send({ error: 'Erreur serveur' });
  }
};

const getSalonDetails = async (req, res) => {
  const { salonId } = req.query;

  // Validation de l'ID
  if (!salonId || !mongoose.Types.ObjectId.isValid(salonId)) {
    return res.status(400).json({ 
      success: false,
      error: 'ID de salon invalide ou manquant'
    });
  }

  try {
    // Récupération des détails du salon avec quelques statistiques
    const salon = await Salon.findById(salonId)
      .select('name description address phone email images openingHours createdAt')
      .lean();

    if (!salon) {
      return res.status(404).json({ 
        success: false,
        error: 'Salon non trouvé' 
      });
    }

    // Récupération du nombre de produits
    const productCount = await Product.countDocuments({ salon: salonId });

    // Formatage des heures d'ouverture
    const formattedHours = salon.openingHours ? {
      ...salon.openingHours,
      formatted: `${salon.openingHours.open} - ${salon.openingHours.close}`
    } : null;

    // Réponse enrichie
    res.json({
      success: true,
      salon: {
        ...salon,
        openingHours: formattedHours,
        productCount,
        mainImage: salon.images?.[0] || null
      }
    });

  } catch (err) {
    console.error('Erreur getSalonDetails:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
   

const submitReview = async (req, res) => {
  try {
    const { salonId, productId, rating, comment } = req.body;
    const clientId = req.user._id;

    // Validation
    if (!salonId || !productId || !rating) {
      return res.status(400).json({ error: 'Salon, produit et note sont requis' });
    }

    // Vérifier si l'utilisateur a déjà noté ce produit
    const existingReview = await Review.findOne({ salon: salonId, product: productId, client: clientId });
    if (existingReview) {
      return res.status(400).json({ error: 'Vous avez déjà noté ce produit' });
    }

    // Créer la review
    const review = new Review({
      salon: salonId,
      product: productId,
      client: clientId,
      rating,
      comment
    });

    await review.save();

    // Mettre à jour la moyenne des notes du salon
    await updateSalonRating(salonId);

    res.status(201).json({ 
      success: true,
      review,
      message: 'Merci pour votre avis !'
    });

  } catch (err) {
    console.error('Erreur submitReview:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: err.message 
    });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate('client', 'username profile')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true,
      reviews 
    });

  } catch (err) {
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: err.message 
    });
  }
};

const getSalonReviews = async (req, res) => {
  try {
    const { salonId } = req.params;

    const reviews = await Review.find({ salon: salonId })
      .populate('client', 'username profile')
      .populate('product', 'name')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true,
      reviews 
    });

  } catch (err) {
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: err.message 
    });
  }
};

// Fonction utilitaire pour mettre à jour la note moyenne
const updateSalonRating = async (salonId) => {
  try {
    // Conversion explicite en ObjectId avec 'new'
    const salonObjectId = new mongoose.Types.ObjectId(salonId);

    // Calculer la nouvelle moyenne
    const result = await Review.aggregate([
      { $match: { salon: salonObjectId } },
      { 
        $group: { 
          _id: null, 
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 }
        } 
      }
    ]);

    const averageRating = result[0]?.averageRating || 0;
    const reviewCount = result[0]?.reviewCount || 0;

    // Mettre à jour le salon
    await Salon.findByIdAndUpdate(salonObjectId, { 
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewCount
    });

    // Mettre à jour les produits concernés
    const productsWithReviews = await Review.distinct('product', { salon: salonObjectId });
    
    for (const productId of productsWithReviews) {
      const productObjectId = new mongoose.Types.ObjectId(productId);
      
      const productResult = await Review.aggregate([
        { 
          $match: { 
            salon: salonObjectId,
            product: productObjectId 
          } 
        },
        { 
          $group: { 
            _id: null, 
            averageRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 }
          } 
        }
      ]);

      await Product.findByIdAndUpdate(productObjectId, {
        averageRating: productResult[0]?.averageRating || 0,
        reviewCount: productResult[0]?.reviewCount || 0
      });
    }

  } catch (err) {
    console.error('Erreur dans updateSalonRating:', err);
    throw err; // Conservez cette ligne pour que l'erreur remonte
  }
};
const getCategoriesBySalon = async (req, res) => {
  try {
    const categories = await Category.find({ salon: req.query.salonId })
      .select('_id name description image salon createdAt')
      .lean();

    res.json({
      success: true,
      categories: categories // On envoie directement les données sans transformation
    });
  } catch (err) {
    console.error('Error in getCategoriesBySalon:', err);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Récupérer les produits d'une catégorie
const getProductsByCategory = async (req, res) => {
  const { salonId, categoryId } = req.query;

  try {
    const products = await Product.find({ 
      salon: salonId,
      category: categoryId 
    }).populate('ingredients.ingredient');

    res.json({ 
      success: true,
      products 
    });
  } catch (err) {
    console.error('Erreur getProductsByCategory:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};



// Ajoutez au exports:


// Dans votre clientController.js
const updateReview = async (req, res) => {
  try {
    const { reviewId, salonId, productId, rating, comment } = req.body;
    const clientId = req.user._id;

    // Validation renforcée avec messages d'erreur précis
    if (!reviewId || !mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({ error: 'ID de review invalide' });
    }
    if (!salonId || !mongoose.isValidObjectId(salonId)) {
      return res.status(400).json({ error: 'ID de salon invalide' });
    }
    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ error: 'ID de produit invalide' });
    }

    // Conversion explicite en ObjectId
    const reviewObjectId = new mongoose.Types.ObjectId(reviewId);
    const clientObjectId = new mongoose.Types.ObjectId(clientId);

    // Debug: Afficher les IDs pour vérification
    console.log('IDs reçus:', {
      reviewId: reviewObjectId,
      clientId: clientObjectId,
      salonId,
      productId
    });

    // Recherche et mise à jour en une opération
    const updatedReview = await Review.findOneAndUpdate(
      {
        _id: reviewObjectId,
        client: clientObjectId,
        salon: salonId,
        product: productId
      },
      {
        $set: {
          rating,
          ...(comment !== undefined && { comment }), // Ne met à jour que si comment existe
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedReview) {
      return res.status(404).json({
        error: 'Review non trouvée ou vous n\'êtes pas l\'auteur'
      });
    }

    // Mise à jour des moyennes
    await updateSalonRating(salonId);

    return res.status(200).json({
      success: true,
      review: updatedReview,
      message: 'Review mise à jour avec succès'
    });

  } catch (err) {
    console.error('Erreur détaillée:', err);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        stack: err.stack,
        type: err.name
      } : undefined
    });
  }
};



const submitSalonReview = async (req, res) => {
  try {
    const { salonId, rating, comment } = req.body;
    const clientId = req.user._id;

    if (!salonId || !rating) {
      return res.status(400).json({ error: 'Salon et note sont requis' });
    }

    // Vérifier si l'utilisateur a déjà noté ce salon
    const existingReview = await Review.findOne({ 
      salon: salonId, 
      client: clientId,
      product: null // Seulement les avis sur le salon (sans produit spécifique)
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Vous avez déjà noté ce salon' });
    }

    // Créer la review
    const review = new Review({
      salon: salonId,
      client: clientId,
      rating,
      comment,
      // Pas de productId pour les avis sur le salon global
    });

    await review.save();

    // Mettre à jour la moyenne des notes du salon
    await updateSalonRating(salonId);

    res.status(201).json({ 
      success: true,
      review,
      message: 'Merci pour votre avis sur le salon !'
    });

  } catch (err) {
    console.error('Erreur submitSalonReview:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: err.message 
    });
  }
};

// Mettre à jour un avis sur le salon
const updateSalonReview = async (req, res) => {
  try {
    const { reviewId, salonId, rating, comment } = req.body;
    const clientId = req.user._id;

    // Validation
    if (!reviewId || !salonId || !rating) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Trouver et mettre à jour la review
    const updatedReview = await Review.findOneAndUpdate(
      {
        _id: reviewId,
        salon: salonId,
        client: clientId,
        product: null // Seulement les avis sur le salon
      },
      {
        rating,
        comment,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ error: 'Avis non trouvé ou non autorisé' });
    }

    // Mettre à jour la moyenne du salon
    await updateSalonRating(salonId);

    res.json({
      success: true,
      review: updatedReview,
      message: 'Avis mis à jour avec succès'
    });

  } catch (err) {
    console.error('Erreur updateSalonReview:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: err.message 
    });
  }
};

// Récupérer les avis d'un salon

// Nouvelle méthode pour modifier le mot de passe depuis le profil
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  try {
    // 1. Vérifier l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // 2. Vérifier le mot de passe actuel
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    }

    // 3. Hacher et sauvegarder le nouveau mot de passe
    user.password = newPassword;
    await user.save();

    // 4. Répondre avec succès
    res.json({ 
      success: true,
      message: 'Mot de passe mis à jour avec succès' 
    });

  } catch (err) {
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: err.message 
    });
  }
};

// Dans clientController.js
const cleanOldOrders = async (req, res) => {
  try {
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    
    const result = await Order.deleteMany({ 
      createdAt: { $lt: seventyTwoHoursAgo },
      client: req.user._id
    });
    
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Supprimé ${result.deletedCount} anciennes commandes`
    });
  } catch (err) {
    console.error('Erreur cleanOldOrders:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: err.message 
    });
  }
};

const cleanOldNotifications = async (req, res) => {
  try {
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    
    const result = await Notification.deleteMany({ 
      createdAt: { $lt: seventyTwoHoursAgo },
      user: req.user._id
    });
    
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Supprimé ${result.deletedCount} anciennes notifications`
    });
  } catch (err) {
    console.error('Erreur cleanOldNotifications:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: err.message 
    });
  }
};
const cancelOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const clientId = req.user._id;

    // Validation
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'ID de commande invalide' });
    }

    // Trouver la commande
    const order = await Order.findOne({
      _id: orderId,
      client: clientId
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    // Vérifier si la commande peut être annulée
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Cette commande ne peut plus être annulée car elle est déjà en préparation' 
      });
    }

    if (order.isCancelled) {
      return res.status(400).json({ 
        error: 'Cette commande a déjà été annulée' 
      });
    }

    // Mettre à jour la commande
    order.isCancelled = true;
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    await order.save();

    // Créer une notification pour le gérant
    const notification = new Notification({
      user: order.salon, // Le gérant du salon
      message: `Commande #${order._id} annulée par le client. Raison: ${reason}`,
      relatedOrder: order._id
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Commande annulée avec succès',
      order
    });

  } catch (err) {
    console.error('Erreur cancelOrder:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
const getPromoProducts = async (req, res) => {
  const { salonId } = req.query;

  try {
    // Vérifier que le salon existe et est approuvé
    const salon = await Salon.findOne({ 
      _id: salonId, 
      status: 'approved' 
    });
    
    if (!salon) {
      return res.status(404).send({ error: 'Salon non trouvé ou non approuvé' });
    }

    // Récupérer les produits en promotion valide (date non expirée)
    const products = await Product.find({
      salon: salonId,
      isOnPromo: true,
      'promoDetails.endDate': { $gt: new Date() }
    }).populate('category').populate('ingredients.ingredient');

    res.send({ products });
  } catch (err) {
    console.error('Erreur getPromoProducts:', err);
    res.status(500).send({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
  const getActiveOffers = async (req, res) => {
  try {
    const { salonId } = req.query;

    // Vérifier que le salon existe et est approuvé
    const salon = await Salon.findOne({ 
      _id: salonId, 
      status: 'approved' 
    });
    
    if (!salon) {
      return res.status(404).json({ error: 'Salon non trouvé ou non approuvé' });
    }

    // Récupérer les offres actives
    const offers = await Offer.find({
      salon: salonId,
      isActive: true,
      endDate: { $gt: new Date() }
    })
    .populate({
      path: 'products.product',
      select: 'name price image',
      populate: {
        path: 'ingredients.ingredient',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true,
      offers: offers.map(offer => ({
        ...offer._doc,
        formattedPrice: offer.price.toFixed(2),
        remainingDays: Math.ceil((offer.endDate - Date.now()) / (1000 * 60 * 60 * 24))
      }))
    });
  } catch (err) {
    console.error('Erreur getActiveOffers:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const addOfferToCart = async (req, res) => {
  try {
    const { salonId, offerId } = req.body;
    const userId = req.user._id;

    if (!salonId || !mongoose.Types.ObjectId.isValid(salonId)) {
      return res.status(400).json({ error: 'ID de salon invalide' });
    }
    if (!offerId || !mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({ error: 'ID d\'offre invalide' });
    }

    const offer = await Offer.findOne({
      _id: offerId,
      salon: salonId,
      isActive: true,
      endDate: { $gt: new Date() }
    }).populate('products.product');

    if (!offer) {
      return res.status(404).json({ error: 'Offre non trouvée ou non active' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    if (!user.cart) user.cart = [];

    const existingOfferItems = user.cart.filter(item => item.offer && item.offer.toString() === offerId);
    if (existingOfferItems.length > 0) {
      existingOfferItems.forEach(item => {
        item.quantity += 1;
      });
    } else {
      const offerPricePerProduct = offer.price / offer.products.length;
      for (const offerProduct of offer.products) {
        const product = offerProduct.product;
        if (!product) {
          console.warn(`Produit non trouvé pour l'ID: ${offerProduct.product}`);
          continue;
        }

        user.cart.push({
          offer: offer._id,
          product: product._id,
          quantity: offerProduct.quantity,
          price: offerPricePerProduct
        });
      }
    }

    await user.save();

    const userWithCart = await User.findById(userId).populate([
      { path: 'cart.product', select: 'name image price isOnPromo promoDetails' },
      { path: 'cart.offer', select: 'name price' }
    ]);

    res.status(200).json({
      success: true,
      cart: userWithCart.cart.map(item => ({
        ...item.toObject(),
        quantity: Number(item.quantity),
        price: Number(item.price),
        offer: item.offer ? {
          ...item.offer.toObject(),
          price: Number(item.offer.price)
        } : null
      })),
      message: 'Offre ajoutée au panier avec succès'
    });

  } catch (err) {
    console.error('Erreur addOfferToCart:', err);
    res.status(500).json({
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  registerClient,
  cancelOrder,
  changePassword,
  getProfile ,
  removeFromCart,
  updateSalonReview,
  updateProfileImage,
  addToCart ,
  loginClient,
  getProductsBySalon,
  getSalonDetails,
  getSalons,
  forgotPassword,
  resetPassword ,
  verifyResetCode,
  updateReview ,
  placeOrder,
  getProductDetails,
  searchSalons,
  getNotifications,
  getOrderHistory,
  updateProfile ,
  getProductsByCategory,
  getCategoriesBySalon,
  submitReview,
  getProductReviews,
  getSalonReviews,
  cleanOldNotifications,
  submitSalonReview,
  cleanOldOrders,
  getPromoProducts,
  getActiveOffers,
  addOfferToCart,
   googleAuth,

}