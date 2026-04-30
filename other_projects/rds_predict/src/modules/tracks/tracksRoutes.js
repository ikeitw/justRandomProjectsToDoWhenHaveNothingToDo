import express from 'express';
import { getTrackById, getTracks } from './tracksController.js';

const router = express.Router();

router.get('/', getTracks);
router.get('/:trackId', getTrackById);

export default router;