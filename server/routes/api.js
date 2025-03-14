const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const JWT_SECRET = 'your-secret-key'; // Thay bằng key bí mật của bạn
// Cấu hình email
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // Sử dụng `true` nếu dùng cổng 465, `false` nếu dùng cổng 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,}

});


// Đăng ký người dùng
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (error) {
    res.status(400).json({ message: 'Email đã tồn tại' });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
  }
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Không có token' });
  try {
    const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Lấy danh sách dịch vụ
router.get('/services', async (req, res) => {
  const services = await Service.find();
  res.json(services);
});

// Tạo lịch hẹn
router.post('/appointments', authMiddleware, async (req, res) => {
  const { service, date, name } = req.body;

  // Kiểm tra xem có lịch hẹn nào trùng giờ không
  const existingAppointment = await Appointment.findOne({ service, date });
  if (existingAppointment) {
    return res.status(400).json({ message: 'Giờ này đã được đặt cho dịch vụ này!' });
  }
  const appointment = new Appointment({ service, date, name, userId: req.userId });
  await appointment.save();
  // Gửi email xác nhận
  const user = await User.findById(req.userId);
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Xác nhận lịch hẹn',
    text: `Bạn đã đặt lịch hẹn:\nDịch vụ: ${service}\nThời gian: ${new Date(date).toLocaleString()}\nTên: ${name}`,
  };
  await transporter.sendMail(mailOptions);
  
  res.status(201).json({ message: 'Đặt lịch thành công', appointment });
});

router.get('/appointments', authMiddleware, async (req, res) => {
  const appointments = await Appointment.find({ userId: req.userId });
  res.json(appointments);
});

router.delete('/appointments/:id',authMiddleware, async (req, res) => {
  const { id } = req.params;
  const appointment = await Appointment.findByIdAndDelete({ _id: id, userId: req.userId });
  if (!appointment) {
    return res.status(404).json({ message: 'Không tìm thấy lịch hẹn!' });
  }
  res.json({ message: 'Hủy lịch thành công' });
});

module.exports = router;