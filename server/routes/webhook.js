const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Payment = mongoose.model('Payment');
const Appointment = mongoose.model('Appointment');

router.post('/webhook-qr', express.json(), async (req, res) => { // Sử dụng express.json()
  let event = req.body;
  if (!event || typeof event !== 'object') {
    console.error('Webhook Error: Dữ liệu không hợp lệ');
    return res.status(400).send('Webhook Error: Dữ liệu không hợp lệ');
  }

  const { transactionId, status } = event;

  try {
    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin thanh toán' });
    }

    payment.status = status;
    await payment.save();

    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment) {
      appointment.status = status === 'paid' ? 'paid' : 'pending';
      await appointment.save();
    }

    console.log(`Payment ${transactionId} updated to status: ${status}`);
     return res.status(200).json({ message: 'Webhook received & processed successfully!' });
  } catch (error) {
    console.error(`Error updating payment status: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi khi xử lý webhook', error: error.message });
  }
});

module.exports = router;