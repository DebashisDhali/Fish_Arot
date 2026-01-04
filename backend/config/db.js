const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes for better performance
    await createIndexes();
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
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
