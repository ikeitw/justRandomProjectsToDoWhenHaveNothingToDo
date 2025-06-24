const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match');

router.get('/buyers-for-car/:id', matchController.buyersForCar);
router.get('/cars-for-buyer/:id', matchController.carsForBuyer);

module.exports = router;
