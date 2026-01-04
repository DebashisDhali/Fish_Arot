const express = require('express');
const router = express.Router();
const {
  generateFarmerReceipt,
  generateBuyerReceipt,
  getBuyerStatement,
  getFarmerStatement
} = require('../controllers/receiptController');
const { protect } = require('../middleware/auth');

// Routes
router.get('/buyer-statement', protect, getBuyerStatement);
router.get('/farmer-statement', protect, getFarmerStatement);
router.get('/:id/farmer', protect, generateFarmerReceipt);
router.get('/:id/buyer', protect, generateBuyerReceipt);

module.exports = router;
