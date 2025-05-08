const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Payment = mongoose.model('Payment');
const Appointment = mongoose.model('Appointment');

// Webhook endpoint nhận thông báo từ VietQR
router.post('/webhook-qr', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;

  try {
    // Trong thực tế, bạn cần xác minh request từ VietQR (kiểm tra signature, token, v.v.)
    event = JSON.parse(req.body);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Giả lập thông báo từ VietQR
  const { paymentId, status } = event;

  try {
    // Tìm Payment theo paymentId
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin thanh toán' });
    }

    // Cập nhật trạng thái Payment
    payment.status = status; // 'paid' hoặc 'failed'
    await payment.save();

    // Cập nhật trạng thái Appointment
    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment) {
      appointment.status = status === 'paid' ? 'paid' : 'pending';
      await appointment.save();
    }

    console.log(`Payment ${paymentId} updated to status: ${status}`);
  } catch (error) {
    console.error(`Error updating payment status: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi khi xử lý webhook', error: error.message });
  }

  // Trả về response 200 để xác nhận đã nhận webhook
  res.status(200).json({ received: true });
});

module.exports = router;