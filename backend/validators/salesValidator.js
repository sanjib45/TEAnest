const { body } = require('express-validator');

const TEA_TYPES = ['Black', 'Green', 'White', 'Oolong', 'Herbal', 'CTC', 'Orthodox'];
const STATUSES = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

exports.createRules = [
  body('orderId').trim().notEmpty().withMessage('Order ID is required'),
  body('buyerName').trim().notEmpty().withMessage('Buyer name is required'),
  body('teaType').notEmpty().isIn(TEA_TYPES).withMessage('Invalid tea type'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be positive'),
  body('pricePerUnit').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('orderDate').optional().isISO8601().withMessage('Valid order date required'),
  body('status').optional().isIn(STATUSES).withMessage('Invalid status'),
];

exports.updateRules = [
  body('buyerName').optional().trim().notEmpty(),
  body('teaType').optional().isIn(TEA_TYPES),
  body('quantity').optional().isFloat({ min: 0 }),
  body('pricePerUnit').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(STATUSES),
];
