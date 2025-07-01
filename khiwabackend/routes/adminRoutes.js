const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

const upload = require('../uploads');
router.post('/register', adminController.registerAdmin);
router.post('/login', adminController.loginAdmin);
router.post('/assign-role', auth, adminController.assignRole);
router.get('/users', auth, adminController.getAllUsers);
router.post('/create-gerant', auth, adminController.createGerant); // Créer un gérant
router.put('/update-gerant/:id', auth, adminController.updateGerant); // Mettre à jour un gérant
router.delete('/delete-gerant/:id', auth, adminController.deleteGerant); // Supprimer un gérant
router.post('/toggle-gerant-status', auth, adminController.toggleGerantStatus); 
router.get('/pending-salons', auth, adminController.getPendingSalons); // Récupérer les salons en attente
router.post('/toggle-user-status', auth, adminController.toggleUserStatus); // Activer/Désactiver un utilisateur

router.post('/create-salon-for-gerant', auth, upload.array('images'), adminController.createSalonForGerant);
router.post('/toggle-salon-status', auth, adminController.toggleSalonStatus);
router.get('/salon-history', auth, adminController.getSalonHistory);
router.put('/update-salon/:id', auth, upload.array('images'), adminController.updateSalon);
router.get('/statistics', auth, adminController.getStatistics);
router.get('/salon/:id', auth, adminController.getSalon);
module.exports = router;
