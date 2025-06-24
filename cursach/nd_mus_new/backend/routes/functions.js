const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/functions');

router.get('/ensemble/:id/compositions-count', ctrl.getCompositionCount);
router.get('/ensemble/:id/records', ctrl.getEnsembleCDs);
router.get('/records/top-sales', ctrl.getTopSelling);

module.exports = router;
