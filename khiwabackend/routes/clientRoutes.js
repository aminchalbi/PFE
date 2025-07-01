const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const auth = require('../middleware/auth');
const multer = require('multer');

const path = require('path');
const passport = require('passport');


const upload = require('../uploads');

router.get('/promo-products', auth, clientController.getPromoProducts);
router.post('/cancel-order', auth, clientController.cancelOrder);
router.get('/offers/active', auth, clientController.getActiveOffers);
router.get('/get-profile', auth, clientController.getProfile);
router.post('/register', clientController.registerClient);
router.post('/login', clientController.loginClient);
router.post('/forgot-password', clientController.forgotPassword);
router.post('/reset-password', clientController.resetPassword);
router.post('/verify-reset-code', clientController.verifyResetCode);
router.post('/place-order',auth, clientController.placeOrder);
router.get('/notifications', auth, clientController.getNotifications);
router.get('/order-history', auth, clientController.getOrderHistory);
router.put('/update-profile', 
    auth,
    upload.single('image'), // Utilisez directement le middleware upload
    clientController.updateProfile
  );
router.get('/search-salons', auth, clientController.searchSalons);
router.put('/update-profile-image', auth, upload.single('image'),clientController.updateProfileImage);
router.post('/add-to-cart', auth, clientController.addToCart);
router.post('/remove-from-cart', auth, clientController.removeFromCart);
router.get('/product-details', auth, clientController.getProductDetails);
router.get('/salon-details', auth, clientController.getSalonDetails);
router.get('/get-salons', auth, clientController.getSalons);
router.get('/products-by-salon', auth, clientController.getProductsBySalon);
router.post('/cart/add-offer', auth, clientController.addOfferToCart);
router.put('/update-review', auth, clientController.updateReview);
router.post('/submit-review', auth, clientController.submitReview);
router.get('/product-reviews/:productId', clientController.getProductReviews);
router.get('/salon-reviews/:salonId', clientController.getSalonReviews);
router.get('/categories-by-salon', auth, clientController.getCategoriesBySalon);
router.get('/products-by-category', auth, clientController.getProductsByCategory);
router.post('/submit-salon-review', auth, clientController.submitSalonReview);
router.put('/update-salon-review', auth, clientController.updateSalonReview);
router.put('/change-password', auth, clientController.changePassword);
// routes.js
router.post('/google-auth', clientController.googleAuth);
router.delete('/clean-old-orders', auth, clientController.cleanOldOrders);
router.delete('/clean-old-notifications', auth, clientController.cleanOldNotifications);
module.exports = router;