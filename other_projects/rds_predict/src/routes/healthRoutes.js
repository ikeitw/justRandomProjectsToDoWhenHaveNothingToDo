import express from 'express';
import { getHealth, getHealthDetailed } from '../controllers/healthController.js';

const router = express.Router();

/**
 * GET /health
 * Simple health check endpoint
 */
router.get('/health', getHealth);

/**
 * GET /health/detailed
 * Extended health check with provider connectivity check
 */
router.get('/health/detailed', getHealthDetailed);

export default router;

