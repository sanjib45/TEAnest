const { body } = require('express-validator');

const TEA_TYPES = ['Black','Green','White','Oolong','Herbal','CTC','Orthodox'];
const GRADES = ['BOPF','BOP','OP','FBOP','Pekoe','Dust','Fannings','Silver Tips','Golden Tips'];
const STATUSES = ['In Stock','Low Stock','Out of Stock','Processing','Dispatched'];

exports.createRules = [
  body('batchId').trim().notEmpty().withMessage('Batch ID required').isLength({ min:3, max:20 }),
  body('teaType').notEmpty().isIn(TEA_TYPES).withMessage('Invalid tea type'),
  body('grade').notEmpty().isIn(GRADES).withMessage('Invalid grade'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be positive'),
  body('pricePerUnit').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('harvestDate').isISO8601().withMessage('Valid harvest date required'),
  body('expiryDate').optional().isISO8601(),
  body('status').optional().isIn(STATUSES),
];

exports.updateRules = [
  body('teaType').optional().isIn(TEA_TYPES),
  body('grade').optional().isIn(GRADES),
  body('quantity').optional().isFloat({ min: 0 }),
  body('pricePerUnit').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(STATUSES),
];
