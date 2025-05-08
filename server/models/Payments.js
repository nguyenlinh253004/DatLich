const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paymentId: { type: String, required: true, unique: true },
  transactionId: { type: String, required: true, unique: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  method: { type: String, enum: ['qr', 'card', 'cash'], required: true },
  expiresAt: { type: Date },
  
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
// Thêm index phức hợp
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual populate nếu cần
paymentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});
module.exports = mongoose.model('Payment', paymentSchema);
