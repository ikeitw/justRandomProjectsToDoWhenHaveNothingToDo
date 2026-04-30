import { logger } from '../utils/logger.js';
import githubModelsProvider from '../services/githubModelsProvider.js';

/**
 * Controller for /ai/chat endpoint
 *
 * Handles incoming chat requests, validates input, calls the provider,
 * and returns normalized responses.
 */

/**
 * POST /ai/chat
 *
 * Request body:
 * {
 *   "message": "user prompt here",
 *   "system": "optional system prompt here"
 * }
 *
 * Response:
 * {
 *   "ok": true,
 *   "model": "openai/gpt-4.1",
 *   "output_text": "...",
 *   "raw": { ... },
 *   "timestamp": "2026-04-21T..."
 * }
 */
export async function postChat(req, res) {
  try {
    const { message, system } = req.body || {};

    // Validate message
    if (!message) {
      logger.warn('Chat request missing message field');
      return res.status(400).json({
        ok: false,
        error: 'Missing required field: message',
        code: 'MISSING_MESSAGE',
      });
    }

    if (typeof message !== 'string') {
      logger.warn('Chat request has invalid message type');
      return res.status(400).json({
        ok: false,
        error: 'Field "message" must be a string',
        code: 'INVALID_MESSAGE_TYPE',
      });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      logger.warn('Chat request has empty message');
      return res.status(400).json({
        ok: false,
        error: 'Field "message" cannot be empty',
        code: 'EMPTY_MESSAGE',
      });
    }

    if (trimmedMessage.length > 32000) {
      logger.warn('Chat request exceeds length limit');
      return res.status(400).json({
        ok: false,
        error: 'Message exceeds 32,000 character limit',
        code: 'MESSAGE_TOO_LONG',
      });
    }

    // Validate optional system prompt
    let systemPrompt = null;
    if (system !== undefined) {
      if (typeof system !== 'string') {
        logger.warn('Chat request has invalid system type');
        return res.status(400).json({
          ok: false,
          error: 'Field "system" must be a string',
          code: 'INVALID_SYSTEM_TYPE',
        });
      }
      if (system.trim().length > 0) {
        systemPrompt = system.trim();
        if (systemPrompt.length > 32000) {
          logger.warn('Chat request system prompt exceeds limit');
          return res.status(400).json({
            ok: false,
            error: 'System prompt exceeds 32,000 character limit',
            code: 'SYSTEM_TOO_LONG',
          });
        }
      }
    }

    // Log request (message content masked from logs in production)
    logger.info('Incoming chat request', {
      messageLength: trimmedMessage.length,
      hasSystemPrompt: !!systemPrompt,
    });

    // Call AI provider
    const result = await githubModelsProvider.chat(trimmedMessage, systemPrompt);

    // Build response
    const response = {
      ok: true,
      model: result.model,
      output_text: result.output_text,
      raw: result.raw,
      timestamp: new Date().toISOString(),
    };

    logger.info('Chat request successful', {
      model: result.model,
      outputLength: result.output_text.length,
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error('Chat request failed', { error: error.message });

    // Determine appropriate status code
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';

    if (error.message.includes('Authentication failed')) {
      statusCode = 503;
      code = 'PROVIDER_AUTH_ERROR';
    } else if (error.message.includes('Rate limit')) {
      statusCode = 429;
      code = 'RATE_LIMITED';
    } else if (error.message.includes('timeout')) {
      statusCode = 504;
      code = 'PROVIDER_TIMEOUT';
    } else if (error.message.includes('unavailable')) {
      statusCode = 503;
      code = 'PROVIDER_UNAVAILABLE';
    }

    res.status(statusCode).json({
      ok: false,
      error: error.message,
      code,
      timestamp: new Date().toISOString(),
    });
  }
}

