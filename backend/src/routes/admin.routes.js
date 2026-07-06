const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth.middleware');

// Protect all admin routes and check admin role
router.use(protect);
router.use(adminOnly);

router.get('/queue', adminController.getQueue);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.patch('/orders/:id/price', adminController.updateOrderPrice);
router.get('/orders', adminController.getAllOrders);
router.post('/orders/batch-print', adminController.batchPrintOrders); // New recruiter-ready feature

module.exports = router;
