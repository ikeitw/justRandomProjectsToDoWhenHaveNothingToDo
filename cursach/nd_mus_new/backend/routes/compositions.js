const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/compositions');

router.get('/', ctrl.getAllCompositions);
router.post('/', ctrl.addComposition);
router.put('/:id', ctrl.updateComposition);
router.delete('/:id', ctrl.deleteComposition);

module.exports = router;
