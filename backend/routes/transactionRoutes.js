const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getStats
} = require('../controllers/transactionController');
const { protect, admin } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const transactionValidation = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('farmerName').trim().notEmpty().withMessage('Farmer name is required'),
  body('buyerName').trim().notEmpty().withMessage('Buyer name is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one fish item is required'),
  body('items.*.fishType').notEmpty().withMessage('Fish type is required for all items'),
  body('items.*.ratePerMon').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Rate must be a non-negative number'),
  body('items.*.rate').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Rate must be a non-negative number'),
  body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be non-negative')
];

// Routes
router.get('/stats', protect, getStats);
router.post('/', protect, transactionValidation, validate, createTransaction);
router.get('/', protect, getTransactions);
router.get('/:id', protect, getTransaction);
router.put('/:id', protect, updateTransaction);
router.delete('/:id', protect, admin, deleteTransaction);

module.exports = router;
