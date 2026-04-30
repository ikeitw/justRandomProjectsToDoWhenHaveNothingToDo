import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { postChat } from '../controllers/aiController.js';

const router = express.Router();

/**
 * POST /ai/chat
 * Protected AI chat endpoint requiring Bearer token authentication
 *
 * Request body:
 * {
 *   "message": "user message",
 *   "system": "optional system prompt"
 * }
 */
router.post('/chat', authMiddleware, postChat);

export default router;

