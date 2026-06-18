const mongoose = require('mongoose');

const laborSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  role: { type: String, required: [true, 'Role is required'], enum: ['Plucker', 'Factory Worker', 'Supervisor', 'Maintenance', 'Other'] },
  contact: { type: String, trim: true },
  dailyWage: { type: Number, required: [true, 'Daily wage is required'], min: 0 },
  joinDate: { type: Date, required: [true, 'Join date is required'], default: Date.now },
  status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
  notes: { type: String, maxlength: 500 }
}, { timestamps: true });

module.exports = mongoose.model('Labor', laborSchema);
