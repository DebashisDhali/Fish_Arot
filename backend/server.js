require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors()); // Allows all origins
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1 style="color: #4f46e5;">🐟 Fish Arot API is Live!</h1>
      <p>This is the backend server for Fish Arot Management System.</p>
      <p>Please visit the <b>Vercel URL</b> to use the application.</p>
      <div style="margin-top: 20px; padding: 10px; background: #f3f4f6; border-radius: 8px; display: inline-block;">
        Status: <span style="color: green; font-weight: bold;">Healthy</span>
      </div>
    </div>
  `);
});

// API status route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Fish Arot API v1.0.0',
    endpoints: ['/api/auth', '/api/transactions', '/api/receipts', '/api/settings']
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running smoothly',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🏪 Arot: ${process.env.AROT_NAME}`);
  console.log(`📍 Location: ${process.env.AROT_LOCATION}\n`);
});
