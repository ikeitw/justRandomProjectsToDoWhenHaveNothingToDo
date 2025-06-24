const express = require('express');
const router = express.Router();
const dealershipController = require('../controllers/dealerships');

router.get('/', dealershipController.getAll);
router.post('/', dealershipController.create);
router.get('/:id/cars', dealershipController.getCars);
router.delete('/:id', dealershipController.delete);
router.put('/:id', dealershipController.update);

module.exports = router;
