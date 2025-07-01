const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log("Middleware auth exécuté");
    
    // Vérification du header Authorization
    if (!req.header('Authorization')) {
      return res.status(401).send({ error: 'Authorization header missing' });
    }

    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, 'secretkey');

    // Récupération de l'utilisateur avec ses relations
    const user = await User.findOne({ 
      _id: decoded._id, 
      'tokens.token': token 
    }).populate('salon');

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }



    /**if (user.role === 'gerant' && user.salon?.status !== 'approved') {
      return res.status(403).send({ 
        error: 'Accès refusé : Votre salon est désactivé. Contactez l\'administrateur.' 
      });
    }*/

    // Ajout des informations à la requête
    req.token = token;
    req.user = {
      _id: user._id, 
      role: user.role,
    
      salonId: user.salon?._id, // Ajout du salonId pour les gérants
      salonStatus: user.salon?.status 
    };

    console.log("Utilisateur authentifié:", {
      id: user._id,
      role: user.role,
      salonId: user.salon?._id,
      salonStatus: user.salon?.status 
    });

    next();
  } catch (err) {
    console.error("Erreur d'authentification:", err.message);
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

module.exports = auth;