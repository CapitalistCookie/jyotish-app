import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import chartRoutes from './routes/chart.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8081',  // Expo web
    'http://localhost:19006', // Expo web alt
    'http://localhost:3000',  // Next.js (if used)
    /^exp:\/\//,              // Expo Go app
  ],
  credentials: true,
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'jyotish-backend',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chart', chartRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║     🌟 Jyotish Backend Server 🌟          ║
╠═══════════════════════════════════════════╣
║  Running on: http://localhost:${PORT}        ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
╚═══════════════════════════════════════════╝

Available endpoints:
  GET  /health              - Health check
  POST /api/auth/register   - Register user
  POST /api/auth/login      - Login user
  POST /api/chart/generate  - Generate birth chart
  GET  /api/chart/:id       - Get saved chart
  GET  /api/chart/test/calculate - Test calculation
  `);
});

export default app;
