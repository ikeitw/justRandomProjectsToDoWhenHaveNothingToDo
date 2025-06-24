const express = require('express');
const router = express.Router();
const carController = require('../controllers/cars');

router.get('/', carController.getAll);
router.post('/', carController.create);
router.get('/:id', carController.getById);
router.put('/:id', carController.update);
router.delete('/:id', carController.remove);

module.exports = router;
