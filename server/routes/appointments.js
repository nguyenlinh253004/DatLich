const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

// Đặt lịch
router.post('/book', async (req, res) => {
    const { service, date,name, phone, email, note, userId } = req.body;
    
    if (!service || !date || !name || !phone) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }
  
    try {
      const appointment = new Appointment({ 
        service, 
        date, 
        name, 
        phone, 
        email: email || '', 
        note: note || '',
        userId,
        status: 'pending' 
      });
      
      await appointment.save();
      res.status(201).json({ 
        message: 'Đặt lịch thành công!', 
        appointmentId: appointment._id 
      });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi khi đặt lịch', error: err });
    }
  });
// Hủy lịch
router.delete('/cancel/:id', async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Hủy lịch thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi hủy lịch', error: err });
  }
});
router.put('/:id', async (req, res) => {
    try {
      const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.status(200).json(appointment);
    } catch (err) {
      res.status(500).json({ message: 'Lỗi khi cập nhật lịch', error: err });
    }
  });
module.exports = router;