const mongoose = require('mongoose');

const teaInventorySchema = new mongoose.Schema({
  batchId: { type: String, required: [true, 'Batch ID required'], unique: true, trim: true, uppercase: true },
  teaType: { type: String, required: [true, 'Tea type required'], enum: ['Black','Green','White','Oolong','Herbal','CTC','Orthodox'] },
  grade: { type: String, required: [true, 'Grade required'], enum: ['BOPF','BOP','OP','FBOP','Pekoe','Dust','Fannings','Silver Tips','Golden Tips'] },
  quantity: { type: Number, required: [true, 'Quantity required'], min: 0 },
  unit: { type: String, default: 'kg', enum: ['kg','g','lb'] },
  pricePerUnit: { type: Number, required: [true, 'Price required'], min: 0 },
  harvestDate: { type: Date, required: [true, 'Harvest date required'] },
  expiryDate: { type: Date },
  fieldSection: { type: String, trim: true },
  status: { type: String, enum: ['In Stock','Low Stock','Out of Stock','Processing','Dispatched'], default: 'In Stock' },
  notes: { type: String, maxlength: 500 },
}, { timestamps: true });

teaInventorySchema.virtual('totalValue').get(function () {
  return this.quantity * this.pricePerUnit;
});
teaInventorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('TeaInventory', teaInventorySchema);
