const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  service: { type: String, required: true },
  date: { type: String, required: true },
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('Appointment', appointmentSchema);