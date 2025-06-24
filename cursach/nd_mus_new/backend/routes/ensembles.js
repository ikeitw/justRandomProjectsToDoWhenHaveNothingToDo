const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ensembles');

router.get('/', ctrl.getAllEnsembles);
router.post('/', ctrl.addEnsemble);
router.put('/:id', ctrl.updateEnsemble);
router.delete('/:id', ctrl.deleteEnsemble);

module.exports = router;
