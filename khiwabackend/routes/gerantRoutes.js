const express = require('express');
const router = express.Router();
const gerantController = require('../controllers/gerantController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const Offer = require('../models/Offer');



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads')); // Dossier où les images seront stockées
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Nom du fichier
  },
});




const upload = multer({ storage });
router.use(express.urlencoded({ extended: true }));
// Routes pour les produits
router.post('/assign-roles', auth, gerantController.assignRoles);
router.put('/update-ingredient/:ingredientId', auth, gerantController.updateIngredient);
router.post('/toggle-Comptoiriste-Status', auth, gerantController.toggleComptoiristeStatus);
router.post('/add-product', auth, gerantController.addProduct);
router.get('/products', auth, gerantController.getProducts);
router.put('/update-product/:productId', auth, gerantController.updateProduct);
router.delete('/delete-product/:productId', auth, gerantController.deleteProduct);
router.post('/login', gerantController.loginGerant);
router.get('/statistics', auth, gerantController.getStatistics);
router.post('/products/:productId/promo', auth, upload.none(), gerantController.addPromoToProduct);
router.delete('/products/:productId/promo', auth, gerantController.removePromoFromProduct);
router.get('/products/promo', auth, gerantController.getPromoProducts);

// Dans votre fichier de routes
router.get('/daily-revenue', auth, gerantController.getDailyRevenue);
// Dans les routes (backend)
router.get('/salon', auth, gerantController.getSalon); // Pas besoin de salonId dans l'URL
// Routes pour lpoes ingrédients
router.post('/add-ingredient', auth, gerantController.addIngredient);
router.get('/ingredients', auth, gerantController.getIngredients);
router.put('/update-comptoiriste/:id', auth, gerantController.updateComptoiriste);
router.delete('/delete-ingredient/:ingredientId', auth, gerantController.deleteIngredient);
router.get('/orders', auth, gerantController.getOrders);
router.post('/update-order-status', auth, gerantController.updateOrderStatus);
router.post('/create-comptoiriste', auth, gerantController.createComptoiriste);
router.put('/update-comptoiriste',auth,gerantController.updateComptoiriste);
router.get('/comptoiristes', auth,gerantController.getComptoiristes);
// Ajouter cette nouvelle route
router.delete('/delete-comptoiriste/:id', auth, gerantController.deleteComptoiriste);




 
router.get('/product-reviews', auth, gerantController.getProductReviews);
router.get('/salon-reviews', auth, gerantController.getSalonReviews);


  router.post('/upload-image', auth, upload.single('image'), gerantController.uploadImage);

  router.get('/getCriticalIngredients', auth, gerantController.getCriticalIngredients);

// Routes pour les catégories
router.post('/categories', auth, upload.single('image'), gerantController.createCategory);
router.get('/categories', auth, gerantController.getCategories);
router.put('/categories/:categoryId', auth, upload.single('image'), gerantController.updateCategory);
router.delete('/categories/:categoryId', auth, gerantController.deleteCategory);
// routes/gerant.js


router.post('/offers', auth, gerantController.createOffer);
router.get('/offers', auth, gerantController.getOffers);
router.put('/offers/:offerId', auth, gerantController.updateOffer);
router.delete('/offers/:offerId', auth, gerantController.deleteOffer);
module.exports = router;