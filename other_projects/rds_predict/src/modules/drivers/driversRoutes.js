import express from 'express';
import { getDriverById, getDrivers } from './driversController.js';

const router = express.Router();

router.get('/', getDrivers);
router.get('/:driverId', getDriverById);

export default router;