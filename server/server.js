const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const apiRoutes = require('./routes/api');
const rateLimit = require('express-rate-limit');
const webhookRoutes = require('./routes/webhook');

// Gọi dotenv ngay đầu file để load biến môi trường trước
dotenv.config();

const app = express();

app.use(cors());

// Middleware
app.use(express.json());
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 phút
//   message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút',
//   max: 100 // Giới hạn 100 request mỗi 15 phút
// });

// app.use(limiter);
// Phục vụ file tĩnh từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', apiRoutes);
// Nếu muốn dùng paymentRoutes và appointment riêng, uncomment và tạo file tương ứng
// app.use('/api/payments', require('./routes/payments'));
// app.use('/api/appointments', require('./routes/appointments'));
app.use('/api', webhookRoutes);
// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Kết nối MongoDB thành công'))
  .catch((err) => console.error('Lỗi kết nối MongoDB:', err));

// Route thử nghiệm
app.get('/', (req, res) => {
  res.send('Backend đang chạy!');
});

// Middleware xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  console.error('Lỗi server:', err.stack);
  res.status(500).json({ message: 'Có lỗi xảy ra ở server', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});