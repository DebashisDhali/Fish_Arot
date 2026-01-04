const Transaction = require('../models/Transaction');
const Settings = require('../models/Settings');
const { generateReceipt, generateStatement, generateFarmerStatement } = require('../utils/pdfGenerator');

// @desc    Generate farmer receipt PDF
// @route   GET /api/receipts/:id/farmer
// @access  Private
const generateFarmerReceipt = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const settings = await Settings.findOne();
    
    // Set headers
    const safeName = (settings?.arotName || 'arot').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${safeName}-farmer-${transaction.receiptNo}.pdf`);
    
    generateReceipt(res, transaction, settings, 'farmer');
  } catch (error) {
    console.error('Generate farmer receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating farmer receipt',
      error: error.message
    });
  }
};

// @desc    Generate buyer receipt PDF
// @route   GET /api/receipts/:id/buyer
// @access  Private
const generateBuyerReceipt = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const settings = await Settings.findOne();

    // Set headers
    const safeName = (settings?.arotName || 'arot').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${safeName}-buyer-${transaction.receiptNo}.pdf`);

    generateReceipt(res, transaction, settings, 'buyer');
  } catch (error) {
    console.error('Generate buyer receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating buyer receipt',
      error: error.message
    });
  }
};

// @desc    Generate a consolidated buyer statement (ledger)
// @route   GET /api/receipts/buyer-statement
// @access  Private
const getBuyerStatement = async (req, res) => {
  try {
    const { buyerName, startDate, endDate, transactionType } = req.query;

    if (!buyerName) {
      return res.status(400).json({ success: false, message: 'Buyer name is required' });
    }

    // Use partial match (regex) to be consistent with Transaction List filtering
    const cleanName = buyerName.trim();
    const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = { 
      buyerName: { $regex: escapedName, $options: 'i' }, 
      isDeleted: false 
    };

    if (transactionType) {
        query.transactionType = transactionType;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query).sort({ date: 1 });
    console.log(`[Statement] Buyer: "${cleanName}", Found: ${transactions.length}`);

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No transactions found for "${cleanName}"`
      });
    }

    const settings = await Settings.findOne();
    
    // Set headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=statement-${cleanName}.pdf`);

    // Call the generator
    generateStatement(res, transactions, cleanName, settings, { startDate, endDate });
    
  } catch (error) {
    console.error('Statement Generation Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error generating statement',
        error: error.message
      });
    }
  }
};

// @desc    Generate a consolidated farmer statement (ledger)
// @route   GET /api/receipts/farmer-statement
// @access  Private
const getFarmerStatement = async (req, res) => {
  try {
    const { farmerName, startDate, endDate, transactionType } = req.query;

    if (!farmerName) {
      return res.status(400).json({ success: false, message: 'Farmer/Owner name is required' });
    }

    const cleanName = farmerName.trim();
    const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = { 
      farmerName: { $regex: escapedName, $options: 'i' }, 
      isDeleted: false 
    };

    if (transactionType) {
        query.transactionType = transactionType;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query).sort({ date: 1, createdAt: 1 });
    console.log(`[Owner Statement] Name: "${cleanName}", Found: ${transactions.length}`);

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No transactions found for "${cleanName}"`
      });
    }

    const settings = await Settings.findOne() || {}; 
    
    const safeFilename = cleanName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=owner-statement-${safeFilename}.pdf`);

    try {
      generateFarmerStatement(res, transactions, cleanName, settings, { startDate, endDate });
    } catch (genError) {
      console.error('PDF Generation Error:', genError);
      throw genError; // Re-throw to be caught by outer catch
    }
    
  } catch (error) {
    console.error('Farmer Statement Error Stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error generating owner statement',
        error: error.message
      });
    }
  }
};

module.exports = {
  generateFarmerReceipt,
  generateBuyerReceipt,
  getBuyerStatement,
  getFarmerStatement
};
