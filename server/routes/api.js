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
const Payment = require('../models/Payments');
const QRCode = require('qrcode');
const speakeasy = require('speakeasy');
const { body, validationResult } = require('express-validator');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Thay đổi đường dẫn nếu cần
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
// Get current user profile
router.get('/users/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -twoFactorSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update user profile
router.put('/users/me', authMiddleware, async (req, res) => {
  const { name, phone, address, gender, dateOfBirth, occupation, avatar } = req.body;
  
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.gender = gender || user.gender;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.occupation = occupation || user.occupation;
    user.avatar = avatar || user.avatar;
    
    await user.save();
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Mật khẩu phải có ít nhất 8 ký tự'),
    body('name').notEmpty().withMessage('Tên là bắt buộc').trim(),
    body('phone').optional().isMobilePhone().withMessage('Số điện thoại không hợp lệ'),
    body('dateOfBirth').optional().isDate().withMessage('Ngày sinh không hợp lệ'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, name, phone, address, gender, dateOfBirth, occupation } = req.body;
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã tồn tại' });
      }

      const user = new User({ 
        email, 
        password,
        name,
        phone,
        address,
        gender,
        dateOfBirth,
        occupation
      });
      
      await user.save();
      
      // Optionally send welcome email here
      
      res.status(201).json({ 
        message: 'Đăng ký thành công',
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Lỗi khi đăng ký', error: err.message });
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
// kiểm tra thời gian còn trống
router.post('/appointments/check-availability', authMiddleware, async (req, res) => {
  const { date } = req.body;

  try {
    if (!date) {
      return res.status(400).json({ message: 'Thiếu thông tin ngày giờ' });
    }

    const appointmentDate = new Date(date);
    const startTime = new Date(appointmentDate);
    const endTime = new Date(appointmentDate.getTime() + 30 * 60 * 1000); // Giả sử mỗi lịch hẹn kéo dài 30 phút

    const conflictingAppointments = await Appointment.find({
      date: {
        $gte: startTime,
        $lt: endTime,
      },
    });

    if (conflictingAppointments.length > 0) {
      return res.json({ available: false });
    }

    return res.json({ available: true });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi kiểm tra thời gian khả dụng', error: err.message });
  }
});
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
// Xác nhận thanh toán qua mã QR
router.put('/payments/confirm-qr/:paymentId', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền xác nhận thanh toán' });
    }

    const { paymentId } = req.params;
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin thanh toán' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Thanh toán không ở trạng thái chờ xác nhận' });
    }

    payment.status = 'paid';
    await payment.save();

    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment) {
      appointment.status = 'paid';
      await appointment.save();

      // Gửi email thông báo cho người dùng
      // if (appointment.email) {
      //   await sendEmail(
      //     appointment.email,
      //     'Xác nhận thanh toán qua mã QR',
      //     `Chào ${appointment.name},\n\nLịch hẹn của bạn đã được xác nhận thanh toán qua mã QR:\n- Dịch vụ: ${appointment.service}\n- Thời gian: ${new Date(appointment.date).toLocaleString()}\n\nCảm ơn bạn đã sử dụng dịch vụ!\n\nTrân trọng,\nHệ thống đặt lịch`
      //   );
      // }

      // Gửi email thông báo cho admin
      // await sendEmail(
      //   process.env.ADMIN_EMAIL || 'admin@example.com',
      //   'Xác nhận thanh toán qua mã QR',
      //   `Lịch hẹn đã được xác nhận thanh toán qua mã QR:\n- Tên khách hàng: ${appointment.name}\n- Dịch vụ: ${appointment.service}\n- Thời gian: ${new Date(appointment.date).toLocaleString()}`
      // );
    }

    res.json({ success: true, message: 'Xác nhận thanh toán qua mã QR thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi xác nhận thanh toán', error: err.message });
  }
});
// Xác nhận thanh toán tiền mặt
router.put('/appointments/:id/confirm-payment', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền xác nhận thanh toán' });
    }

    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }

    if (appointment.status !== 'cash_pending') {
      return res.status(400).json({ message: 'Lịch hẹn không ở trạng thái chờ thanh toán tiền mặt' });
    }

    appointment.status = 'paid';
    await appointment.save();

    res.json({ success: true, message: 'Xác nhận thanh toán tiền mặt thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi xác nhận thanh toán', error: err.message });
  }
});
// Hủy lịch hẹn
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
  const { amount, appointmentId, paymentMethod } = req.body;

  try {
    // Kiểm tra các tham số bắt buộc
    if (!amount || !appointmentId || !paymentMethod) {
      return res.status(400).json({ message: 'Thiếu amount, appointmentId hoặc paymentMethod' });
    }

    // Tìm lịch hẹn
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }

    // Kiểm tra trạng thái lịch hẹn
    if (appointment.status === 'paid') {
      return res.status(400).json({ message: 'Lịch hẹn đã được thanh toán' });
    }

    // Xử lý theo phương thức thanh toán
    if (paymentMethod === 'cash') {
      appointment.status = 'cash_pending';
      await appointment.save();

      return res.json({
        success: true,
        message: 'Lịch hẹn đã được đặt. Vui lòng thanh toán bằng tiền mặt tại cửa hàng.',
      });
    } else if (paymentMethod === 'online') {
      // Kiểm tra amount tối thiểu cho Stripe (ví dụ: 12,000 VND)
      if (amount < 12000) {
        return res.status(400).json({ message: 'Số tiền phải lớn hơn 12,000 VND để thanh toán qua Stripe' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'vnd',
        metadata: { appointmentId: appointmentId.toString() },
      });

      appointment.status = 'pending';
      await appointment.save();

      return res.json({ clientSecret: paymentIntent.client_secret });
    } else {
      return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ' });
    }
  } catch (err) {
    console.error('Lỗi tại /payments/create-payment-intent:', err);
    res.status(500).json({ message: 'Lỗi khi xử lý thanh toán', error: err.message });
  }
});

// Tạo mã QR
router.post('/payments/create-qr', authMiddleware, async (req, res) => {
  const { amount, appointmentId, paymentMethod } = req.body;

  try {
    if (!amount || !appointmentId || !paymentMethod) {
      return res.status(400).json({ message: 'Thiếu amount, appointmentId hoặc paymentMethod' });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Số tiền không hợp lệ, phải là số dương' });
    }

    if (amount < 12000) {
      return res.status(400).json({ message: 'Số tiền phải lớn hơn 12,000 VND để thanh toán qua mã QR' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }

    if (appointment.status === 'paid') {
      return res.status(400).json({ message: 'Lịch hẹn đã được thanh toán' });
    }

    if (paymentMethod === 'qr') {
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

      let qrCodeBase64;
      try {
        qrCodeBase64 = await QRCode.toDataURL(qrString);
      } catch (qrError) {
        return res.status(500).json({ message: 'Lỗi khi tạo mã QR', error: qrError.message });
      }

      // Lưu thông tin thanh toán
      const payment = new Payment({
        userId: req.userId, // Lưu userId từ token
        paymentId: `PAY-${appointmentId}-${Date.now()}`,
        transactionId: `TRANS-${appointmentId}-${Date.now()}`,
        appointmentId,
        amount,
        status: 'pending',
        method: 'qr',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 phút hết hạn
      });
      await payment.save();

      appointment.status = 'qr_pending';
      await appointment.save();

      return res.json({
        qrCode: qrCodeBase64,
        paymentId: payment.paymentId,
        transactionId: payment.transactionId,
        expiresAt: payment.expiresAt,
        message: 'Mã QR đã được tạo thành công',
      });
    } else {
      return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi tạo mã QR', error: err.message });
  }
});

// Kiểm tra trạng thái thanh toán
router.get('/payments/status/:paymentId', authMiddleware, async (req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin thanh toán' });
    }

    if (new Date() > payment.expiresAt) {
      payment.status = 'expired';
      await payment.save();
      return res.json({ status: 'expired' });
    }

    return res.json({ status: payment.status });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi kiểm tra trạng thái thanh toán', error: err.message });
  }
});
// Thêm route webhook cho thanh toán QR
router.post('/payments/qr-webhook', async (req, res) => {
  const { transactionId, amount, status, timestamp } = req.body;

  try {
    // Xác thực webhook (nên thêm chữ ký hoặc IP whitelist)
    if (!transactionId || !amount || !status) {
      return res.status(400).json({ message: 'Thiếu thông tin giao dịch' });
    }

    // Tìm payment trong database
    const payment = await Payment.findOne({ 
      transactionId,
      status: 'pending',
      method: 'qr'
    });

    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }

    // Kiểm tra số tiền
    if (payment.amount !== amount) {
      return res.status(400).json({ message: 'Số tiền không khớp' });
    }

    // Xử lý theo trạng thái
    if (status === 'success') {
      // Cập nhật trạng thái thanh toán
      payment.status = 'paid';
      payment.paidAt = new Date();
      await payment.save();

      // Cập nhật trạng thái lịch hẹn
      const appointment = await Appointment.findById(payment.appointmentId);
      if (appointment) {
        appointment.status = 'paid';
        await appointment.save();
      }

      // Gửi email xác nhận (nếu cần)
      // ...

      return res.json({ success: true });
    } else if (status === 'failed') {
      payment.status = 'failed';
      await payment.save();
      return res.json({ success: true });
    }

    return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  } catch (err) {
    console.error('Lỗi webhook thanh toán QR:', err);
    res.status(500).json({ message: 'Lỗi khi xử lý webhook' });
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

    // Tính tổng doanh thu từ các lịch hẹn đã thanh toán
    const paidAppointmentsData = await Appointment.find({ status: 'paid' });
    let totalRevenue = 0;

    for (const appt of paidAppointmentsData) {
      // Nếu giá đã được lưu trong Appointment
      if (appt.price) {
        totalRevenue += appt.price;
      } else {
        // Nếu không, lấy giá từ model Service
        const service = await Service.findOne({ name: appt.service });
        if (service && service.price) {
          totalRevenue += service.price;
        }
      }
    }

    res.json({
      success: true,
      data: {
        totalAppointments,
        confirmedAppointments,
        pendingAppointments,
        paidAppointments,
        totalRevenue, // Thêm doanh thu vào response
      },
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

// Webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Xác minh webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Xử lý các sự kiện từ Stripe
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent ${paymentIntent.id} succeeded!`);

      try {
        // Tìm Payment theo paymentId
        const payment = await Payment.findOne({ paymentId: paymentIntent.id });
        if (payment) {
          payment.status = 'paid';
          await payment.save();

          // Cập nhật trạng thái Appointment
          const appointment = await Appointment.findById(payment.appointmentId);
          if (appointment) {
            appointment.status = 'paid';
            await appointment.save();
          }
        }
      } catch (error) {
        console.error(`Error updating payment status: ${error.message}`);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log(`PaymentIntent ${failedPayment.id} failed!`);

      try {
        const payment = await Payment.findOne({ paymentId: failedPayment.id });
        if (payment) {
          payment.status = 'failed';
          await payment.save();
        }
      } catch (error) {
        console.error(`Error updating payment status: ${error.message}`);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
});
// API lấy lịch sử thanh toán
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Thêm userId vào query
    const payments = await Payment.find({ userId: req.userId })
      .populate('appointmentId', 'service date status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Payment.countDocuments({ userId: req.userId });

    res.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy lịch sử thanh toán',
      error: error.message 
    });
  }
});

module.exports = router;
