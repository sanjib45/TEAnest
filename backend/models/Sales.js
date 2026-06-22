const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  date:   { type: Date, required: true, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  mode:   { type: String, enum: ['Cash', 'Online', 'Cheque'], default: 'Online' },
}, { _id: true });

const salesSchema = new mongoose.Schema({
  date:            { type: Date, default: Date.now },
  buyerName:       { type: String, required: [true, 'Buyer name is required'], trim: true },
  totalQuantity:   { type: Number, required: [true, 'Total quantity is required'], min: 0 },   // TOTAL QNTY.
  lessPercentage:  { type: Number, min: 0, default: 0 },                                        // LESS PERCENTAGE
  rate:            { type: Number, required: [true, 'Rate is required'], min: 0 },               // RATE (₹/kg)
  advance:         { type: Number, default: 0, min: 0 },                                        // ADVANCE
  payments:        { type: [paymentSchema], default: [] },                                       // Payment history
  dueDate:         { type: Date },                                                               // DUE date
  remarks:         { type: String, trim: true, maxlength: 500 },                                // REMARKS
}, { timestamps: true });

// ── Virtuals ────────────────────────────────────────────────
// All virtuals use safe fallbacks (|| 0, || []) so that OLD MongoDB
// documents (created with the previous schema) never throw a TypeError.

// Virtual: LESS QNTY = totalQuantity * lessPercentage / 100
salesSchema.virtual('lessQuantity').get(function () {
  const tq = parseFloat(this.totalQuantity) || 0;
  const lp = parseFloat(this.lessPercentage) || 0;
  return parseFloat(((tq * lp) / 100).toFixed(2));
});

// Virtual: NET QNTY = totalQuantity - lessQuantity
salesSchema.virtual('netQuantity').get(function () {
  const tq = parseFloat(this.totalQuantity) || 0;
  return parseFloat((tq - this.lessQuantity).toFixed(2));
});

// Virtual: TOTAL AMOUNT = netQuantity * rate
salesSchema.virtual('totalAmount').get(function () {
  const r = parseFloat(this.rate) || 0;
  return parseFloat((this.netQuantity * r).toFixed(2));
});

// Virtual: TOTAL PAID = sum of all payment amounts
// IMPORTANT: use (this.payments || []) — old documents may have payments=undefined
salesSchema.virtual('totalPaid').get(function () {
  const payments = this.payments || [];
  const sum = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  return parseFloat(sum.toFixed(2));
});

// Virtual: DUE = totalAmount - advance - totalPaid
salesSchema.virtual('due').get(function () {
  const adv = parseFloat(this.advance) || 0;
  return parseFloat((this.totalAmount - adv - this.totalPaid).toFixed(2));
});

salesSchema.set('toJSON', { virtuals: true });
salesSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Sales', salesSchema);
