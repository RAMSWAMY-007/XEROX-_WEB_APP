const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Protect all order routes
router.use(protect);

router.post('/', upload.single('file'), orderController.createOrder);
router.get('/my', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);

module.exports = router;
