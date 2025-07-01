const express = require('express');
const router = express.Router();
const comptoiristeController = require('../controllers/comptoiristeController');
const auth = require('../middleware/auth');

router.post('/login', comptoiristeController.loginComptoiriste);
router.get('/orders', auth, comptoiristeController.getOrders);
router.put('/orders/:id/status', auth, comptoiristeController.updateOrderStatus);
router.get('/ingredients', auth, comptoiristeController.getIngredients);
router.post('/update-stock', auth, comptoiristeController.updateIngredientsStock);
// Clients
router.get('/clients/recent', auth, comptoiristeController.getRecentClients);

// Salon

router.get('/orders/:id', auth, comptoiristeController.getOrderDetails);
module.exports = router;