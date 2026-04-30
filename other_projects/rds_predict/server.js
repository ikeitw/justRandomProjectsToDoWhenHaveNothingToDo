import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import config from './src/config.js';
import { logger } from './src/utils/logger.js';

import healthRoutes from './src/routes/healthRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';

import tracksRoutes from './src/modules/tracks/tracksRoutes.js';
import driversRoutes from './src/modules/drivers/driversRoutes.js';
import carsRoutes from './src/modules/cars/carsRoutes.js';
import teamsRoutes from './src/modules/teams/teamsRoutes.js';
import eventsRoutes from './src/modules/events/eventsRoutes.js';

// Express server for GitHub Models API proxy
// Handles authentication, rate limiting, and routing to AI endpoints

const app = express();

// Security & middleware configuration
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ──────────────────────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────────────────────

app.use('/', healthRoutes);
app.use('/ai', aiRoutes);

app.use('/api/tracks', tracksRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/legacy', express.static('_legacy'));

// ──────────────────────────────────────────────────────────
// ERROR HANDLING
// ──────────────────────────────────────────────────────────

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Not Found',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    path: req.path,
  });

  res.status(500).json({
    ok: false,
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
  });
});

// ──────────────────────────────────────────────────────────
// SERVER STARTUP
// ──────────────────────────────────────────────────────────

function startServer() {
  app.listen(config.port, () => {
    logger.info(`✅ AI Proxy Server listening on port ${config.port}`);
    logger.info(`🔐 Auth: Bearer token required for /ai/chat`);
    logger.info(`🤖 Provider: GitHub Models (${config.githubModel})`);
    logger.info(`📍 Environment: ${config.nodeEnv}`);

    if (config.isDev) {
      logger.info('💡 Development mode - some security checks are relaxed');
    }
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

// Start server
startServer();

export default app;




