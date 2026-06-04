import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import connectDB from './config/db.js';
import donationRoutes from './routes/donationRoutes.js';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  'https://modernhouse.qzz.io',
].filter(Boolean);

app.use(cors({
  origin: true, // This allows ALL origins by reflecting the requested origin back
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

export default app;
