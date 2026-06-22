const Sales = require('../models/Sales');
const { validationResult } = require('express-validator');

// GET /api/sales — list all with optional search/pagination
exports.getAll = async (req, res) => {
  try {
    const { search, sort = '-date', page = 1, limit = 50 } = req.query;
    const filter = {};
    if (search) filter.buyerName = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Sales.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
      Sales.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/sales/stats
exports.getStats = async (req, res) => {
  try {
    const all = await Sales.find({});
    // safe() converts NaN / Infinity (from old-schema docs) to 0
    const safe = (n) => (isNaN(n) || !isFinite(n)) ? 0 : n;

    let totalSalesAmount = 0;
    let totalAdvance = 0;
    let totalPaid = 0;
    let totalDue = 0;

    all.forEach(s => {
      totalSalesAmount += safe(s.totalAmount);
      totalAdvance     += safe(s.advance || 0);
      totalPaid        += safe(s.totalPaid);
      totalDue         += safe(s.due);
    });

    res.json({
      success: true,
      data: {
        totalRecords:     all.length,
        totalSalesAmount: parseFloat(totalSalesAmount.toFixed(2)),
        totalAdvance:     parseFloat(totalAdvance.toFixed(2)),
        totalPaid:        parseFloat(totalPaid.toFixed(2)),
        totalDue:         parseFloat(totalDue.toFixed(2)),
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/sales/:id
exports.getById = async (req, res) => {
  try {
    const item = await Sales.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Sale record not found' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/sales
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const item = await Sales.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/sales/:id
exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const item = await Sales.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Sale record not found' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/sales/:id
exports.remove = async (req, res) => {
  try {
    const item = await Sales.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Sale record not found' });
    res.json({ success: true, message: 'Sale record deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/sales/:id/payments — add a payment entry to a sale record
exports.addPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const item = await Sales.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Sale record not found' });

    item.payments.push({
      date:   req.body.date   || new Date(),
      amount: req.body.amount,
      mode:   req.body.mode,
    });
    await item.save();
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/sales/:id/payments/:paymentId — remove a specific payment
exports.removePayment = async (req, res) => {
  try {
    const item = await Sales.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Sale record not found' });

    const paymentIndex = item.payments.findIndex(p => p._id.toString() === req.params.paymentId);
    if (paymentIndex === -1) return res.status(404).json({ success: false, message: 'Payment not found' });

    item.payments.splice(paymentIndex, 1);
    await item.save();
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
