const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getSettings,
  updateSettings
} = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const settingsValidation = [
  body('commissionRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Commission rate must be between 0 and 100'),
  body('ponaCommissionRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Pona Commission rate must be between 0 and 100'),
  body('shrimpDeductionRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Shrimp deduction rate must be positive'),
  body('fishDeductionRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Fish deduction rate must be positive'),
  body('arotName').optional().trim().notEmpty().withMessage('Arot name cannot be empty'),
  body('arotLocation').optional().trim().notEmpty().withMessage('Arot location cannot be empty')
];

// Routes
// Routes
router.get('/', getSettings);
router.put('/', protect, admin, settingsValidation, validate, updateSettings);

module.exports = router;
