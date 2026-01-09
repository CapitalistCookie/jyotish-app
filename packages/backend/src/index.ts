import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import * as OpenApiValidator from 'express-openapi-validator';

import authRoutes from './routes/auth.js';
import chartRoutes from './routes/chart.js';
import readingRoutes from './routes/reading.js';
import aiRoutes from './routes/ai.js';
import subscriptionRoutes from './routes/subscription.js';
import affiliateRoutes from './routes/affiliate.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load OpenAPI spec
const specPath = path.join(__dirname, 'openapi', 'spec.yaml');
const specFile = fs.readFileSync(specPath, 'utf8');
const apiSpec = YAML.parse(specFile);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8081',      // Expo web local
    'http://localhost:19006',     // Expo web alt
    'http://localhost:3000',      // Next.js (if used)
    'http://192.168.1.225:8081',  // Expo web on server
    /^exp:\/\//,                  // Expo Go app
    /^http:\/\/192\.168\./,       // Any local network IP
  ],
  credentials: true,
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Swagger UI - API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(apiSpec, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #d4af37 }
  `,
  customSiteTitle: 'Jyotish API Documentation',
}));

// Serve OpenAPI spec as JSON
app.get('/api/openapi.json', (req, res) => {
  res.json(apiSpec);
});

// OpenAPI Validator Middleware
app.use(
  OpenApiValidator.middleware({
    apiSpec: specPath,
    validateRequests: true,
    validateResponses: process.env.NODE_ENV === 'development',
    ignorePaths: /.*\/docs.*|.*\/openapi\.json/,
  })
);

// Health check (before API routes)
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
app.use('/api/reading', readingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/admin', adminRoutes);

// OpenAPI validation error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.status && err.errors) {
    // OpenAPI validation error
    console.error('Validation error:', err.errors);
    res.status(err.status).json({
      success: false,
      error: 'Validation failed',
      message: err.message,
      errors: err.errors,
    });
    return;
  }
  next(err);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.path,
  });
});

// General error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server - bind to 0.0.0.0 to allow LAN access
const HOST = process.env.HOST || '0.0.0.0';
app.listen(Number(PORT), HOST, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║     🌟 Jyotish Backend Server 🌟          ║
╠═══════════════════════════════════════════╣
║  Running on: http://${HOST}:${PORT}             ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║  API Docs: http://<your-ip>:${PORT}/api/docs    ║
╚═══════════════════════════════════════════╝

Endpoints validated against OpenAPI spec.
Visit /api/docs for interactive documentation.
  `);
});

export default app;
