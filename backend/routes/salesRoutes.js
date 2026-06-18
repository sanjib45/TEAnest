const router = require('express').Router();
const ctrl = require('../controllers/salesController');
const { createRules, updateRules } = require('../validators/salesValidator');

router.get('/stats', ctrl.getStats);
router.route('/').get(ctrl.getAll).post(createRules, ctrl.create);
router.route('/:id').get(ctrl.getById).put(updateRules, ctrl.update).delete(ctrl.remove);

module.exports = router;
