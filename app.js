require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const donationRoutes = require('./routes/donationRoutes');

const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB();

// Production-Safe Security Headers using Helmet
app.use(helmet());

// Configure CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:4200',
  'http://localhost:3000',
  'http://127.0.0.1:4200',
  'https://modernhouse.qzz.io'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      console.log("✅ CORS Allowed (No Origin)");
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      console.log(`✅ CORS Allowed for origin: ${origin}`);
      return callback(null, true);
    }

    console.error(`❌ CORS Blocked Origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploads ONLY in development environment
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Serve API Routes
app.use('/api/donations', donationRoutes);

// Root Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Global Server Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 Server running on port by Salah ${PORT}`);
  
});

module.exports = app;
