import { logger } from '../utils/logger.js';
import githubModelsProvider from '../services/githubModelsProvider.js';

/**
 * Controller for /health endpoint
 *
 * Simple health check that verifies server is running and optionally
 * checks provider connectivity.
 */

export async function getHealth(req, res) {
  try {
    const response = {
      ok: true,
      provider: 'github-models',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    };

    logger.info('Health check successful');
    res.status(200).json(response);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      ok: false,
      error: 'Health check failed',
      details: error.message,
    });
  }
}

/**
 * Extended health check including provider connectivity
 */
export async function getHealthDetailed(req, res) {
  try {
    const providerHealthy = await githubModelsProvider.healthCheck();

    const response = {
      ok: providerHealthy,
      provider: 'github-models',
      provider_status: providerHealthy ? 'operational' : 'unavailable',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    };

    const statusCode = providerHealthy ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    res.status(503).json({
      ok: false,
      provider_status: 'unavailable',
      error: 'Provider connectivity check failed',
      details: error.message,
    });
  }
}

