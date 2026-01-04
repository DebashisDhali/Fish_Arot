const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes for better performance
    await createIndexes();
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Check if it's a whitelist issue
    if (error.message.includes('MongooseServerSelectionError')) {
      console.log('💡 TIP: Check if your MongoDB Atlas IP Whitelist allows access from anywhere (0.0.0.0/0)');
    }
    // Don't exit immediately on Render, let it retry or show logs
    setTimeout(() => process.exit(1), 5000);
  }
};

const createIndexes = async () => {
  try {
    const Transaction = require('../models/Transaction');
    
    // Create compound indexes for fast filtering
    await Transaction.collection.createIndex({ farmerName: 1, date: -1 });
    await Transaction.collection.createIndex({ buyerName: 1, date: -1 });
    await Transaction.collection.createIndex({ fishCategory: 1, date: -1 });
    await Transaction.collection.createIndex({ date: -1 });
    await Transaction.collection.createIndex({ isPaid: 1 });
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('⚠️  Index creation warning:', error.message);
  }
};

module.exports = connectDB;
