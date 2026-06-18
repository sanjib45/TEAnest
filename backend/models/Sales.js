const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  orderId: { type: String, required: [true, 'Order ID is required'], unique: true, trim: true },
  buyerName: { type: String, required: [true, 'Buyer name is required'], trim: true },
  teaType: { type: String, required: [true, 'Tea type is required'], enum: ['Black', 'Green', 'White', 'Oolong', 'Herbal', 'CTC', 'Orthodox'] },
  quantity: { type: Number, required: [true, 'Quantity is required'], min: 0 },
  pricePerUnit: { type: Number, required: [true, 'Price is required'], min: 0 },
  orderDate: { type: Date, required: [true, 'Order date is required'], default: Date.now },
  status: { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  notes: { type: String, maxlength: 500 }
}, { timestamps: true });

salesSchema.virtual('totalAmount').get(function() {
  return this.quantity * this.pricePerUnit;
});
salesSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Sales', salesSchema);
