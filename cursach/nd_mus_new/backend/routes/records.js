const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/records');

router.get('/', ctrl.getAllRecords);
router.post('/', ctrl.addRecord);
router.put('/:id', ctrl.updateRecord);
router.delete('/:id', ctrl.deleteRecord);

module.exports = router;
