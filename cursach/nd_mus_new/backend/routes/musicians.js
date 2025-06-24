const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/musicians');

router.get('/', ctrl.getAllMusicians);
router.post('/', ctrl.addMusician);
router.put('/:id', ctrl.updateMusician);
router.delete('/:id', ctrl.deleteMusician);

module.exports = router;
