import express from 'express';
import { getCarById, getCars } from './carsController.js';

const router = express.Router();

router.get('/', getCars);
router.get('/:carId', getCarById);

export default router;