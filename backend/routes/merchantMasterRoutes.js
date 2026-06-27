const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/merchantMasterController');
const { createRules, updateRules } = require('../validators/merchantMasterValidator');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/search', ctrl.search);         // GET /api/merchants/search?q=...
router.get('/',       ctrl.getAll);          // GET /api/merchants
router.get('/:id',    ctrl.getById);         // GET /api/merchants/:id
router.post('/',      createRules, ctrl.findOrCreate); // POST /api/merchants
router.put('/:id',    updateRules, ctrl.update);       // PUT /api/merchants/:id
router.delete('/:id', ctrl.remove);          // DELETE /api/merchants/:id

module.exports = router;
