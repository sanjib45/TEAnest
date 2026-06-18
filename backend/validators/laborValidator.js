const { body } = require('express-validator');

const ROLES = ['Plucker', 'Factory Worker', 'Supervisor', 'Maintenance', 'Other'];
const STATUSES = ['Active', 'Inactive', 'On Leave'];

exports.createRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').notEmpty().isIn(ROLES).withMessage('Invalid role'),
  body('contact').optional().trim(),
  body('dailyWage').isFloat({ min: 0 }).withMessage('Daily wage must be positive'),
  body('joinDate').optional().isISO8601().withMessage('Valid join date required'),
  body('status').optional().isIn(STATUSES).withMessage('Invalid status'),
];

exports.updateRules = [
  body('name').optional().trim().notEmpty(),
  body('role').optional().isIn(ROLES),
  body('contact').optional().trim(),
  body('dailyWage').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(STATUSES),
];
