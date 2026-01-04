const Settings = require('../models/Settings');

// @desc    Get settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({
        commissionRate: parseFloat(process.env.DEFAULT_COMMISSION_RATE) || 2.5,
        arotName: process.env.AROT_NAME || 'Chitalmari-Bagerhat Motsho Arot',
        arotLocation: process.env.AROT_LOCATION || 'Foltita Bazar, Fakirhat, Bagerhat'
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching settings',
      error: error.message
    });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private (Admin only)
const updateSettings = async (req, res) => {
  try {
    const { 
      commissionRate, 
      ponaCommissionRate,
      shrimpDeductionRate,
      fishDeductionRate,
      arotName, 
      arotLocation, 
      mobile, 
      tagline, 
      email, 
      logoUrl 
    } = req.body;

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({
        commissionRate,
        ponaCommissionRate,
        shrimpDeductionRate,
        fishDeductionRate,
        arotName,
        arotLocation,
        mobile,
        tagline,
        email,
        logoUrl,
        updatedBy: req.user._id
      });
    } else {
      if (commissionRate !== undefined) settings.commissionRate = commissionRate;
      if (ponaCommissionRate !== undefined) settings.ponaCommissionRate = ponaCommissionRate;
      if (shrimpDeductionRate !== undefined) settings.shrimpDeductionRate = shrimpDeductionRate;
      if (fishDeductionRate !== undefined) settings.fishDeductionRate = fishDeductionRate;
      
      if (arotName !== undefined) settings.arotName = arotName;
      if (arotLocation !== undefined) settings.arotLocation = arotLocation;
      
      if (mobile !== undefined) settings.mobile = mobile;
      if (tagline !== undefined) settings.tagline = tagline;
      if (email !== undefined) settings.email = email;
      if (logoUrl !== undefined) settings.logoUrl = logoUrl;

      settings.updatedBy = req.user._id;
      
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating settings',
      error: error.message
    });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
