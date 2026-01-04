/**
 * Database Initialization Script
 * Run this script to set up initial admin user and settings
 * 
 * Usage: node backend/scripts/init-db.js
 */

require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'muhuri'], default: 'muhuri' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Settings Schema
const settingsSchema = new mongoose.Schema({
  commissionRate: { type: Number, required: true, default: 2.5 },
  arotName: { type: String, required: true, default: 'Chitalmari-Bagerhat Motsho Arot' },
  arotLocation: { type: String, required: true, default: 'Foltita Bazar, Fakirhat, Bagerhat' }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

// Initialize Database
const initializeDatabase = async () => {
  try {
    console.log('\n🔧 Initializing Fish Arot Management Database...\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log('\n   To create a new admin, delete the existing one first.');
    } else {
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const admin = await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });

      console.log('✅ Admin user created successfully!');
      console.log(`   Username: ${admin.username}`);
      console.log('   Password: admin123');
      console.log('\n   ⚠️  IMPORTANT: Change this password after first login!');
    }

    // Check if settings exist
    let settings = await Settings.findOne();
    
    if (settings) {
      console.log('\n✅ Settings already configured:');
      console.log(`   Arot Name: ${settings.arotName}`);
      console.log(`   Location: ${settings.arotLocation}`);
      console.log(`   Commission Rate: ${settings.commissionRate}%`);
    } else {
      // Create default settings
      settings = await Settings.create({
        commissionRate: parseFloat(process.env.DEFAULT_COMMISSION_RATE) || 2.5,
        arotName: process.env.AROT_NAME || 'Chitalmari-Bagerhat Motsho Arot',
        arotLocation: process.env.AROT_LOCATION || 'Foltita Bazar, Fakirhat, Bagerhat'
      });

      console.log('\n✅ Default settings created:');
      console.log(`   Arot Name: ${settings.arotName}`);
      console.log(`   Location: ${settings.arotLocation}`);
      console.log(`   Commission Rate: ${settings.commissionRate}%`);
    }

    console.log('\n✅ Database initialization complete!\n');
    console.log('📝 Next steps:');
    console.log('   1. Start the backend server: cd backend && npm run dev');
    console.log('   2. Start the frontend: cd frontend && npm run dev');
    console.log('   3. Login with admin credentials');
    console.log('   4. Change the admin password immediately');
    console.log('   5. Create additional user accounts as needed\n');

  } catch (error) {
    console.error('❌ Initialization Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run initialization
const run = async () => {
  await connectDB();
  await initializeDatabase();
};

run();
