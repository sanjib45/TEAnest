const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/merchantTransactionController');
const { createRules, updateRules } = require('../validators/merchantTransactionValidator');

// Stats must come before /:id to avoid param capture
router.get('/stats', ctrl.getStats);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', createRules, ctrl.create);
router.put('/:id', updateRules, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
