const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  commissionRate: {
    type: Number,
    required: true,
    default: 2.5,
    min: [0, 'Commission rate cannot be negative'],
    max: [100, 'Commission rate cannot exceed 100%']
  },
  ponaCommissionRate: {
    type: Number,
    required: true,
    default: 3.0,
    min: [0, 'Commission rate cannot be negative'],
    max: [100, 'Commission rate cannot exceed 100%']
  },
  shrimpDeductionRate: {
    type: Number,
    required: true,
    default: 5, // 5% for Shrimps (Standard)
    min: [0, 'Rate cannot be negative']
  },
  fishDeductionRate: {
    type: Number,
    required: true,
    default: 2.5, // 2.5% for General Fish (Standard)
    min: [0, 'Rate cannot be negative']
  },
  arotName: {
    type: String,
    required: true,
    default: 'Chitalmari-Bagerhat Motsho Arot'
  },
  arotLocation: {
    type: String,
    required: true,
    default: 'Foltita Bazar, Fakirhat, Bagerhat'
  },
  mobile: {
    type: String,
    default: '01700000000'
  },
  tagline: {
    type: String,
    default: 'Safe Fish, Fair Price'
  },
  email: {
    type: String,
    default: ''
  },
  logoUrl: {
    type: String,
    default: ''
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
