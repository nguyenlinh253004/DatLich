const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Testimonial = require('../models/Testimonial');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const QRCode = require('qrcode');
const speakeasy = require('speakeasy');
const { body, validationResult } = require('express-validator');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Cấu hình email
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Cấu hình multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Middleware xác thực
const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Người dùng không tồn tại' });
    }
    if (user.isLocked) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
    }
    req.userId = decoded.userId;
    req.userRole = user.role;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Middleware kiểm tra admin
const adminMiddleware = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
  }
  next();
};

// Services
router.post('/services', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, Description, price } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    if (!name) throw new Error('Tên dịch vụ là bắt buộc');
    const service = new Service({ name, Description, price, image });
    await service.save();
    res.status(201).json({ message: 'Thêm dịch vụ thành công', service });
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi thêm dịch vụ', error: err.message });
  }
});

router.put('/services/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, Description, price } = req.body;
    const updateData = { name, Description, price };
    if (req.file) updateData.image = `/uploads/${req.file.filename}`;
    const service = await Service.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!service) return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
    res.json({ message: 'Cập nhật dịch vụ thành công', service });
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi cập nhật dịch vụ', error: err.message });
  }
});

router.delete('/services/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
    res.json({ message: 'Xóa dịch vụ thành công' });
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi xóa dịch vụ', error: err.message });
  }
});

router.get('/services', async (req, res) => {
  const services = await Service.find();
  res.json(services);
});

// Testimonials
router.get('/testimonials', async (req, res) => {
  const testimonials = await Testimonial.find();
  res.json(testimonials);
});

router.post('/testimonials', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { quote, author } = req.body;
    if (!quote || !author) throw new Error('Quote và author là bắt buộc');
    const testimonial = new Testimonial({ quote, author });
    await testimonial.save();
    res.status(201).json({ message: 'Thêm testimonial thành công', testimonial });
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi thêm testimonial', error: err.message });
  }
});

router.put('/testimonials/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { quote, author } = req.body;
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, { quote, author }, { new: true });
    if (!testimonial) return res.status(404).json({ message: 'Không tìm thấy testimonial' });
    res.json({ message: 'Cập nhật testimonial thành công', testimonial });
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi cập nhật testimonial', error: err.message });
  }
});

router.delete('/testimonials/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) return res.status(404).json({ message: 'Không tìm thấy testimonial' });
    res.json({ message: 'Xóa testimonial thành công' });
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi xóa testimonial', error: err.message });
  }
});

// Hero Image
let heroImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c';
router.post('/upload-hero', authMiddleware, adminMiddleware, upload.single('heroImage'), async (req, res) => {
  try {
    heroImage = `/uploads/${req.file.filename}`;
    res.json({ message: 'Upload thành công', heroImage });
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi upload ảnh', error: err.message });
  }
});

router.get('/hero-image', (req, res) => {
  res.json({ heroImage });
});

// User
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng', error: err.message });
  }
});

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('name').notEmpty().withMessage('Tên là bắt buộc'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, name } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã tồn tại' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ email, password: hashedPassword, name });
      await user.save();
      res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (err) {
      res.status(400).json({ message: 'Lỗi khi đăng ký', error: err.message });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
      }
      // Nếu 2FA được kích hoạt, không trả về token ngay
      if (user.twoFactorEnabled) {
        return res.json({
          success: true,
          requires2FA: true,
          userId: user._id,
          role: user.role, // Thêm trường role
          email: user.email // Có thể thêm nếu cần
        });
      }
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({success: true, token, user: { email: user.email, role: user.role } });
    } catch (err) {
      res.status(400).json({ message: 'Lỗi khi đăng nhập', error: err.message });
    }
  }
);

// Appointments
router.post('/appointments', authMiddleware, async (req, res) => {
  try {
    const { service, date, name, phone, email, note } = req.body;
    if (!service || !date || !name) throw new Error('Service, date và name là bắt buộc');
    const existingAppointment = await Appointment.findOne({ service, date });
    if (existingAppointment) {
      return res.status(400).json({ message: 'Giờ này đã được đặt cho dịch vụ này!' });
    }

    // Gửi email xác nhận đặt lịch
    // if (email) {
    //   const mailOptions = {
    //     from: process.env.SMTP_USER,
    //     to: email,
    //     subject: 'Xác nhận đặt lịch hẹn',
    //     text: `Chào ${name},\n\nBạn đã đặt lịch thành công!\nDịch vụ: ${service}\nThời gian: ${new Date(date).toLocaleString('vi-VN')}\n\nCảm ơn bạn!`,
    //   };
    //   await transporter.sendMail(mailOptions);
    // }

    // Lấy giá từ dịch vụ
    const serviceData = await Service.findOne({ name: service });
    if (!serviceData) {
      return res.status(400).json({ message: 'Dịch vụ không tồn tại' });
    }

    const appointment = new Appointment({
      service,
      date,
      name,
      phone,
      email,
      price: serviceData.price,
      note,
      userId: req.userId,
    });
    await appointment.save();

    res.status(201).json({ message: 'Đặt lịch thành công', appointment: appointment.toJSON() });
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi đặt lịch', error: err.message });
  }
});

router.get('/appointments', authMiddleware, async (req, res) => {
  try {
    // Xử lý query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const { search = '', status, paymentStatus, confirmed } = req.query;

    // Kiểm tra page và limit
    if (isNaN(page) || page < 1) {
      return res.status(400).json({ message: 'Page phải là số lớn hơn 0' });
    }
    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({ message: 'Limit phải là số lớn hơn 0' });
    }

    // Xây dựng query
    const query = req.userRole === 'admin' ? {} : { userId: req.userId };


    if (search) {
      query.$or = [
        { service: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      const now = new Date();
      
      // Đảm bảo now là ISO string hoặc Date object phù hợp
      const nowISO = now.toISOString();
      
      if (status === 'upcoming') {
        query.date = { $gt: nowISO }; // Hoặc $gt: now nếu database hỗ trợ
      } else if (status === 'past') {
        query.date = { $lte: nowISO }; // Hoặc $lte: now
      }
      
     
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query.status = paymentStatus;
    }

    if (confirmed && confirmed !== 'all') {
      query.confirmed = confirmed;
    }

  

    // Lấy danh sách lịch hẹn
    const appointments = await Appointment.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    // Đếm tổng số bản ghi
    const total = await Appointment.countDocuments(query);



    res.json({
      success: true,
      data: appointments,
      total,
      page,
      limit
    });
  } catch (err) {
    console.error('Error in /appointments:', err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách lịch hẹn', error: err.message });
  }
});

router.put('/appointments/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { service, date, name, phone, email, note } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }
    appointment.service = service || appointment.service;
    appointment.date = date || appointment.date;
    appointment.name = name || appointment.name;
    appointment.phone = phone || appointment.phone;
    appointment.email = email || appointment.email;
    appointment.note = note || appointment.note;
    await appointment.save();
    res.json({ message: 'Cập nhật lịch hẹn thành công', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật lịch hẹn', error: err.message });
  }
});

router.put('/appointments/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { status },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }
    res.json({ message: 'Cập nhật trạng thái thành công', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái', error: err.message });
  }
});

router.put('/appointments/:id/confirm', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { confirmed } = req.body;
    if (!['confirmed', 'rejected'].includes(confirmed)) {
      return res.status(400).json({ message: 'Trạng thái xác nhận không hợp lệ' });
    }
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }
    appointment.confirmed = confirmed;
    await appointment.save();

    // Gửi email thông báo
    // const user = await User.findById(appointment.userId);
    // if (user && user.email) {
    //   const mailOptions = {
    //     from: process.env.SMTP_USER,
    //     to: user.email,
    //     subject: 'Cập nhật trạng thái lịch hẹn',
    //     text: `Chào ${appointment.name},\n\nLịch hẹn của bạn vào ${new Date(appointment.date).toLocaleString()} đã được ${
    //       confirmed === 'confirmed' ? 'xác nhận' : 'từ chối'
    //     }.\n\nCảm ơn bạn!`,
    //   };
    //   await transporter.sendMail(mailOptions);
    // }

    res.json({ message: `Lịch hẹn đã được ${confirmed === 'confirmed' ? 'xác nhận' : 'từ chối'}`, appointment });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái lịch hẹn', error: err.message });
  }
});

router.delete('/appointments/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findOneAndDelete({ _id: id, userId: req.userId });
    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn!' });
    }
    res.json({ message: 'Hủy lịch thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi hủy lịch', error: err.message });
  }
});

// Payments
router.post('/payments/create-payment-intent', authMiddleware, async (req, res) => {
  const { amount, appointmentId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'vnd',
      metadata: { appointmentId },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi tạo Payment Intent', error: err.message });
  }
});

router.post('/payments/create-qr', authMiddleware, async (req, res) => {
  const { amount, appointmentId } = req.body;

  try {
    if (!amount || !appointmentId) {
      return res.status(400).json({ message: 'Thiếu amount hoặc appointmentId' });
    }

    const bankInfo = {
      bankId: 'TPBANK',
      accountNumber: '03653904809',
      accountName: 'NGUYEN QUANG LINH',
    };

    const qrData = {
      bankId: bankInfo.bankId,
      accountNumber: bankInfo.accountNumber,
      amount: amount,
      description: `Thanh toan lich hen ${appointmentId}`,
    };

    const qrString = `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNumber}-compact2.png?amount=${qrData.amount}&addInfo=${encodeURIComponent(qrData.description)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

    const qrCodeBase64 = await QRCode.toDataURL(qrString);

    res.json({ qrCode: qrCodeBase64, message: 'Mã QR đã được tạo thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi tạo mã QR', error: err.message });
  }
});

// Users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = {
      $or: [{ email: { $regex: search, $options: 'i' } }],
    };
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await User.countDocuments(query);
    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng', error: err.message });
  }
});

router.put('/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    user.role = role;
    await user.save();
    res.json({ message: 'Cập nhật vai trò thành công', user });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật vai trò', error: err.message });
  }
});

router.put('/users/:id/lock', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { isLocked } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    user.isLocked = isLocked;
    await user.save();
    res.json({ message: `Tài khoản đã được ${isLocked ? 'khóa' : 'mở khóa'}`, user });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái tài khoản', error: err.message });
  }
});
// xem doanh thu
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền xem thống kê' });
    }

    const totalAppointments = await Appointment.countDocuments();
    const confirmedAppointments = await Appointment.countDocuments({ confirmed: 'confirmed' });
    const pendingAppointments = await Appointment.countDocuments({ confirmed: 'pending' });
    const paidAppointments = await Appointment.countDocuments({ status: 'paid' });

    res.json({
      success: true,
      data: {
        totalAppointments,
        confirmedAppointments,
        pendingAppointments,
        paidAppointments
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy thống kê', error: err.message });
  }
});
// ----Xác thực 2 yếu tố-----
router.post('/setup-2fa', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền kích hoạt 2FA' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Tạo secret key
    const secret = speakeasy.generateSecret({
      length: 32,
      name: `YourApp (${user.email})`,
    });

    // Lưu secret key tạm thời (chưa kích hoạt 2FA)
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Tạo mã QR
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      qrCodeUrl,
      secret: secret.base32, // Gửi secret để hiển thị cho người dùng (nếu cần nhập thủ công)
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi thiết lập 2FA', error: err.message });
  }
});
// xác minh mã OTP
router.post('/verify-2fa', authMiddleware, async (req, res) => {
  try {
    const { token: userToken } = req.body; // Mã OTP từ người dùng

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: 'Chưa thiết lập 2FA' });
    }

    // Xác minh mã OTP
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: userToken,
      window: 1, // Cho phép sai lệch 1 khoảng thời gian (30 giây)
    });

    if (!verified) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ' });
    }

    // Kích hoạt 2FA
    user.twoFactorEnabled = true;
    await user.save();

    res.json({ success: true, message: 'Kích hoạt 2FA thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi xác minh 2FA', error: err.message });
  }
});
// xắc thực mã OTP
router.post('/verify-2fa-login', async (req, res) => {
  try {
    const { userId, token: userToken } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA không được kích hoạt' });
    }

    // Xác minh mã OTP
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: userToken,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      success: true, 
      token,
      user: {
        email: user.email,
        role: user.role // Trả về role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi xác minh 2FA', error: err.message });
  }
});
// tắt 2FA
router.post('/disable-2fa', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền tắt 2FA' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    user.twoFactorSecret = null;
    user.twoFactorEnabled = false;
    await user.save();

    res.json({ success: true, message: 'Tắt 2FA thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi tắt 2FA', error: err.message });
  }
});
// kiểm tra trạng thái 2FA
router.get('/2fa-status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.json({ success: true, is2FAEnabled: user.twoFactorEnabled });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi kiểm tra trạng thái 2FA', error: err.message });
  }
});
module.exports = router;