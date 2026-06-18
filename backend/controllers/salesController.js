const Sales = require('../models/Sales');
const { validationResult } = require('express-validator');

exports.getAll = async (req, res) => {
  try {
    const { status, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.buyerName = { $regex: search, $options: 'i' };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Sales.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
      Sales.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const [summary, byStatus] = await Promise.all([
      Sales.aggregate([
        { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: { $multiply: ['$quantity', '$pricePerUnit'] } } } }
      ]),
      Sales.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    res.json({ success: true, data: { summary: summary[0] || { totalOrders: 0, totalRevenue: 0 }, byStatus } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const item = await Sales.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const item = await Sales.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Order ID already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const item = await Sales.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const item = await Sales.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
