const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  service: { type: String, required: true },
  date: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String,},
  email: { type: String, },
  note: { type: String, },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'paid', 'cancelled', 'cash_pending', 'qr_pending'], },
  price: { type: Number, default: 100000 }, // Thêm trường price
  confirmed: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' }, // Thêm trường confirmed
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Appointment', appointmentSchema);