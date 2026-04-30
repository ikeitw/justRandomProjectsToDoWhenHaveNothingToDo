import express from 'express';
import { getEventById, getEvents } from './eventsController.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/:eventId', getEventById);

export default router;