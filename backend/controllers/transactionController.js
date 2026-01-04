const Transaction = require('../models/Transaction');
const Settings = require('../models/Settings');
const { calculateTransaction } = require('../utils/calculations');

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private (Admin/Muhuri)
exports.createTransaction = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    const calculation = calculateTransaction(req.body, settings);

    const transaction = new Transaction({
      ...req.body,
      ...calculation,
      createdBy: req.user.id
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Transaction Error:', error);
    
    // Detailed validation and duplicate error handling
    let message = error.message || 'Server Error';
    if (error.code === 11000) {
        message = 'Database Error: Duplicate Receipt Number generated. Please try again.';
    } else if (error.name === 'ValidationError') { // Keep else-if to chain checks
      message = 'Validation Error: ' + Object.values(error.errors).map(val => val.message).join(', ');
    }

    res.status(400).json({
      success: false,
      message: message
    });
  }
};

// @desc    Get all transactions with filters & pagination
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const { 
      farmerName, 
      buyerName, 
      search,
      transactionType,
      startDate, 
      endDate, 
      isPaid, 
      page = 1, 
      limit = 50 
    } = req.query;

    const query = { isDeleted: false };

    if (search) {
      const cleanSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { farmerName: { $regex: cleanSearch, $options: 'i' } },
        { buyerName: { $regex: cleanSearch, $options: 'i' } }
      ];
    } else {
        if (farmerName) query.farmerName = { $regex: farmerName, $options: 'i' };
        if (buyerName) query.buyerName = { $regex: buyerName, $options: 'i' };
    }

    if (transactionType) {
        query.transactionType = transactionType;
    }

    if (isPaid !== undefined && isPaid !== '') query.isPaid = isPaid === 'true';

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('createdBy', 'username');

    res.status(200).json({
      success: true,
      count: transactions.length,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      },
      data: transactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!transaction || transaction.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
exports.updateTransaction = async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction || transaction.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const settings = await Settings.findOne();
    const calculation = calculateTransaction(req.body, settings);

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { ...req.body, ...calculation },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Update Error:', error);
    
    let message = error.message || 'Server Error';
    if (error.name === 'ValidationError') {
      message = Object.values(error.errors).map(val => val.message).join(', ');
    }

    res.status(400).json({
      success: false,
      message: message
    });
  }
};

// @desc    Soft delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private (Admin only)
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Role check
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Admin can delete transactions'
      });
    }

    transaction.isDeleted = true;
    transaction.deletedAt = Date.now();
    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get statistics for dashboard
// @route   GET /api/transactions/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const stats = await Transaction.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalGrossAmount: { $sum: '$grossAmount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalDue: { $sum: '$dueAmount' },
          dueCount: { $sum: { $cond: [{ $gt: ['$dueAmount', 0] }, 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalTransactions: 0,
        totalGrossAmount: 0,
        totalCommission: 0,
        totalDue: 0,
        dueCount: 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
