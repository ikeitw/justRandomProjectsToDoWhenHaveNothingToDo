const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyers');

router.get('/', buyerController.getAll);
router.post('/', buyerController.create);
router.get('/:id', buyerController.getById);
router.put('/:id', buyerController.update);
router.delete('/:id', buyerController.remove);

module.exports = router;
