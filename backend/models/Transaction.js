const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  receiptNo: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  transactionType: {
    type: String,
    enum: ['Fish', 'Pona'],
    default: 'Fish',
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  farmerName: {
    type: String,
    required: [true, 'Farmer name is required'],
    trim: true,
    index: true
  },
  buyerName: {
    type: String,
    required: [true, 'Buyer name is required'],
    trim: true,
    index: true
  },
  items: [{
    fishType: {
      type: String,
      required: [true, 'Fish type is required'],
      index: true
    },
    fishCategory: {
      type: String,
      default: 'Standard',
      index: true
    },
    unit: {
      type: String,
      enum: ['KG', 'Mon', 'Hazar', 'Piece'],
      default: 'KG'
    },
    quantity: {
      type: Number,
      default: 0
    },
    rate: {
      type: Number,
      min: [0, 'Rate cannot be negative']
    },
    // Keep these for legacy weight-based sales
    ratePerMon: {
      type: Number,
      min: [0, 'Rate cannot be negative']
    },
    kachaWeight: {
      type: Number,
      default: 0,
      min: [0, 'Weight cannot be negative']
    },
    pakaWeight: {
      type: Number,
      min: [0, 'Weight cannot be negative']
    },
    itemTotalWeight: { 
      type: Number
    },
    itemGrossAmount: { 
      type: Number
    }
  }],
  totalKachaWeight: {
    type: Number
  },
  totalPakaWeight: {
    type: Number
  },
  totalWeight: {
    type: Number,
    default: 0
  },
  totalQuantity: {
    type: Number,
    default: 0
  },
  grossAmount: {
    type: Number,
    default: 0
  },
  commissionRate: {
    type: Number,
    required: true,
    default: 2.5
  },
  commissionAmount: {
    type: Number,
    default: 0
  },
  netFarmerAmount: {
    type: Number,
    default: 0
  },
  farmerPaidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  farmerDueAmount: {
    type: Number,
    default: 0
  },
  isFarmerPaid: {
    type: Boolean,
    default: false,
    index: true
  },
  buyerPayable: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  dueAmount: {
    type: Number,
    default: 0
  },
  isPaid: {
    type: Boolean,
    default: false,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Auto-generate receipt number
// Auto-generate receipt number robustly
transactionSchema.pre('validate', async function(next) {
  if (this.isNew || !this.receiptNo) {
    try {
      const lastTransaction = await this.constructor.findOne({}, { receiptNo: 1 })
        .sort({ receiptNo: -1 })
        .collation({ locale: 'en_US', numericOrdering: true });

      let nextNum = 1;
      const year = new Date().getFullYear();

      if (lastTransaction && lastTransaction.receiptNo) {
        const parts = lastTransaction.receiptNo.split('-');
        if (parts.length === 3 && parts[1] === String(year)) {
            nextNum = parseInt(parts[2], 10) + 1;
        }
      }

      this.receiptNo = `AR-${year}-${String(nextNum).padStart(6, '0')}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Compound indexes
transactionSchema.index({ farmerName: 1, date: -1 });
transactionSchema.index({ buyerName: 1, date: -1 });
transactionSchema.index({ isPaid: 1, date: -1 });
transactionSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
