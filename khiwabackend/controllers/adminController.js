const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Salon = require('../models/Salon');
const { sendGerantCredentials}= require('../config/email');
// Enregistrement d'un administrateur
const registerAdmin = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const user = new User({ username, email, password, role: 'admin' });
    await user.save();
    res.status(201).send({ user });
  } catch (err) {
    res.status(400).send(err);
  }
};

// Connexion d'un administrateur
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, role: 'admin' });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).send({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ _id: user._id }, 'secretkey');
    user.tokens = user.tokens.concat({ token }); // Ajouter le token
    await user.save(); 
    res.send({ user, token });
  } catch (err) {
    res.status(400).send(err);
  }

};

// Attribution de rôle à un utilisateur
const assignRole = async (req, res) => {
  const { username, email, password, role, salonId } = req.body;

  try {
    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });

    if (!user) {
      // Créer un nouvel utilisateur
      user = new User({ username, email, password, role, salon: salonId });
      await user.save();
    } else {d
      // Mettre à jour le rôle de l'utilisateur existant
      user.role = role;
      user.salon = salonId;
      await user.save();
    }

    res.send({ user });
  } catch (err) {
    res.status(400).send(err);
  }
};

// Récupération de tous les utilisateurs
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.send({ users });
  } catch (err) {
    res.status(400).send(err);
  }
};
const getSalon = async (req, res) => {
  const { id } = req.params;

  try {
    const salon = await Salon.findById(id).populate('gerant', 'username email');
    if (!salon) {
      return res.status(404).send({ error: 'Salon non trouvé' });
    }
    res.status(200).send({ salon });
  } catch (err) {
    res.status(400).send(err);
  }
};

// Rejeter un salon


// Approuver un salon

const createSalonForGerant = async (req, res) => {
  const { name, address, gerantId } = req.body;
   let location;
  try {
    // Vérifier si le gérant existe
    const gerant = await User.findById(gerantId);
    if (!gerant) {
      return res.status(404).send({ error: 'Gérant non trouvé.' });
    }
    const existingSalon = await Salon.findOne({ gerant: gerantId });
    if (existingSalon) {
      return res.status(400).send({ 
        error: 'Ce gérant est déjà associé à un salon (' + existingSalon.name + ')',
        salonId: existingSalon._id
      });
    }
    
    const images = req.files.map(file => file.filename);
     try {
      location = JSON.parse(req.body.location);
    } catch (err) {
      location = {
        type: 'Point',
          coordinates: [9, 34] // Valeur par défaut si erreur
      };
    }
    // Créer un nouveau salon
    const salon = new Salon({
      name,
      address: address || 'Adresse non spécifiée',
      gerant: gerantId,
      images,
      status: 'approved',
         location
    });

    await salon.save();

    // Mettre à jour le gérant avec la référence au salon
    gerant.salon = salon._id;
    await gerant.save();

    res.status(201).send({ salon });
  } catch (err) {
    res.status(400).send(err);
  }
};

// Activer ou désactiver un utilisateur
const toggleUserStatus = async (req, res) => {
  const { userId, isActive } = req.body;

  try {
    const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true });
    if (!user) return res.status(404).send({ error: 'Utilisateur non trouvé' });
    
    res.send({ user });
  } catch (err) {
    res.status(400).send(err);
  }
};


const toggleSalonStatus = async (req, res) => {
  const { salonId, isActive } = req.body;

  try {
    const salon = await Salon.findByIdAndUpdate(
      salonId,
      { status: isActive ? 'approved' : 'pending' },
      { new: true }
    );

    if (!salon) {
      return res.status(404).send({ error: 'Salon non trouvé' });
    }

    res.send({ salon });
  } catch (err) {
    res.status(400).send(err);
  }
};

// Récupération des salons en attente
const getPendingSalons = async (req, res) => {
  try {
    const salons = await Salon.find({ status: 'pending' }).populate('gerant');;
    res.send({ salons });
  } catch (err) {
    res.status(400).send(err);
  }
};
const getSalonHistory = async (req, res) => {
  try {
    const salons = await Salon.find().populate('gerant', 'username email');
    res.status(200).send({ salons });
  } catch (err) {
    res.status(400).send(err);
  }
};
const updateSalon = async (req, res) => {
  const { id } = req.params;
  const { name, address, gerantId } = req.body;
   // Récupérer les chemins des fichiers uploadés
  const images = req.files.map(file => file.filename);
  try {
    const salon = await Salon.findByIdAndUpdate(
      id,
      { name, address: address || 'Adresse non spécifiée', gerant: gerantId, images },
      { new: true }
    ).populate('gerant', 'username email');

    if (!salon) {
      return res.status(404).send({ error: 'Salon non trouvé' });
    }

    res.status(200).send({ salon });
  } catch (err) {
    res.status(400).send(err);
  }
};
// Dans controllers/adminController.js
const getStatistics = async (req, res) => {
  try {
    const salons = await Salon.find().populate('gerant', 'username');
    const statistics = salons.map((salon) => ({
      salonName: salon.name,
      activeUsers: salon.gerant.filter((user) => user.isActive).length,
    }));
    res.status(200).send({ statistics });
  } catch (err) {
    res.status(400).send(err);
  }
};

const createGerant = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const user = new User({ username, email, password, role: 'gerant' });
    await user.save();
    await sendGerantCredentials(email, password);
    res.status(201).send({ user });
  } catch (err) {
    res.status(400).send(err);
  }
};

const updateGerant = async (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;

  try {
    // 1. Vérifier que l'utilisateur existe
    const gerant = await User.findById(id);
    if (!gerant || gerant.role !== 'gerant') {
      return res.status(404).json({ error: 'Gérant non trouvé' });
    }

    // 2. Préparer les données de mise à jour
    const updateData = { 
      username: username || gerant.username,
      email: email || gerant.email 
    };

    // 3. Gestion du mot de passe (seulement si fourni)
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // 4. Mise à jour dans la base de données
    const updatedGerant = await User.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true // Active la validation du schéma
      }
    ).select('-password -tokens'); // Exclut les données sensibles

    if (!updatedGerant) {
      return res.status(500).json({ error: 'Échec de la mise à jour' });
    }

    // 5. Réponse réussie
    res.status(200).json({
      message: 'Gérant mis à jour avec succès',
      gerant: updatedGerant
    });

  } catch (error) {
    console.error('Erreur dans updateGerant:', error);
    
    // Gestion des erreurs de validation
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Erreur générale
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
const deleteGerant = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).send({ error: 'Gérant non trouvé' });
    }
    res.status(200).send({ message: 'Gérant supprimé avec succès' });
  } catch (err) {
    res.status(400).send(err);
  }};
  const toggleGerantStatus = async (req, res) => {
    const { userId, isActive } = req.body;
  
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true }
      );
      if (!user) {
        return res.status(404).send({ error: 'Gérant non trouvé' });
      }
      res.status(200).send({ user });
    } catch (err) {
      res.status(400).send(err);
    }
  };

module.exports = {
  registerAdmin,
  updateGerant,
 
  deleteGerant,
  createGerant,
  getStatistics,
  getSalonHistory,
  updateSalon,
  loginAdmin,
  assignRole,
  getAllUsers,
  toggleGerantStatus,
  toggleUserStatus,
  getPendingSalons,
  toggleSalonStatus,
  createSalonForGerant,
  getSalon
};
