import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import Payment from '../Payment/Payment';

const BookingForm = ({ fetchAppointments, token }) => {
  const [formData, setFormData] = useState({
    service: '',
    date: new Date(),
    name: '',
    phone: '',
    email: '',
    note: '',
  });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentId, setAppointmentId] = useState(null); // Thêm state để lưu appointmentId
  const [selectedServicePrice, setSelectedServicePrice] = useState(0); // Lưu giá dịch vụ

  const isSunday = (date) => date.getDay() === 0;

  // Lấy danh sách dịch vụ
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/services');
        setServices(res.data);
      } catch (err) {
        toast.error('Không thể tải danh sách dịch vụ');
        console.error(err);
      }
    };
    fetchServices();
  }, []);

  // Tạo danh sách khung giờ
  useEffect(() => {
    if (formData.date) {
      const slots = [];
      const startHour = 8;
      const endHour = 17;

      for (let hour = startHour; hour <= endHour; hour++) {
        slots.push(`${hour}:00`);
        if (hour < endHour) slots.push(`${hour}:30`);
      }
      setTimeSlots(slots);
      setSelectedTime('');
    }
  }, [formData.date]);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Cập nhật giá dịch vụ khi chọn dịch vụ
    if (name === 'service') {
      const selectedService = services.find((s) => s.name === value);
      setSelectedServicePrice(selectedService?.price || 0);
    }
  };

  // Xử lý chọn ngày
  const handleDateChange = (date) => {
    setFormData({ ...formData, date });
    setSelectedTime('');
    setShowCalendar(false);
  };

  // Xử lý đặt lịch
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTime) {
      toast.warning('Vui lòng chọn giờ hẹn');
      return;
    }

    try {
      setLoading(true);

      const appointmentDateTime = moment(formData.date)
        .set({
          hour: parseInt(selectedTime.split(':')[0]),
          minute: parseInt(selectedTime.split(':')[1]),
          second: 0,
        })
        .toISOString();

      const res = await axios.post(
        'http://localhost:5000/api/appointments',
        {
          ...formData,
          date: appointmentDateTime,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Đặt lịch thành công! Vui lòng thanh toán để xác nhận.');
      setAppointmentId(res.data.appointment._id); // Lưu appointmentId từ response
      setFormData({
        service: '',
        date: new Date(),
        name: '',
        phone: '',
        email: '',
        note: '',
      });
      setSelectedTime('');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">ĐẶT LỊCH HẸN</h2>
      
      {/* Form đặt lịch */}
      {!appointmentId ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ *</label>
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Chọn dịch vụ --</option>
              {services.map((s) => (
                <option key={s._id} value={s.name}>
                  {s.name} - {s.price ? s.price.toLocaleString('vi-VN') : '0'}đ
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập họ tên đầy đủ"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập số điện thoại"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập email (nếu có)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hẹn *</label>
              <input
                type="text"
                readOnly
                value={moment(formData.date).format('DD/MM/YYYY')}
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full p-3 border border-gray-300 rounded-lg cursor-pointer bg-white"
              />
              {showCalendar && (
                <div className="absolute z-10 mt-1 bg-white shadow-lg rounded-lg">
                  <Calendar
                    onChange={handleDateChange}
                    value={formData.date}
                    minDate={new Date()}
                    locale="vi-VN"
                    className="border-0"
                    tileDisabled={({ date }) => isSunday(date)}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giờ hẹn *</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              >
                <option value="">-- Chọn giờ --</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ghi chú thêm (nếu có)"
              rows="3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'ĐẶT LỊCH NGAY'}
          </button>
        </form>
      ) : (
        // Hiển thị form thanh toán sau khi đặt lịch
        <div>
          <h3 className="text-lg font-semibold mb-4 text-center text-green-600">
            Đặt lịch thành công! Vui lòng thanh toán để xác nhận.
          </h3>
          <Payment
            appointmentId={appointmentId}
            amount={selectedServicePrice || 50000}
            token={token} // Giá dịch vụ hoặc mặc định 50,000
            onSuccess={() => {
              setAppointmentId(null); // Reset sau khi thanh toán thành công
              toast.success('Thanh toán thành công! Lịch hẹn đã được xác nhận.');
            }}
          />
          <button
            onClick={() => setAppointmentId(null)}
            className="mt-4 w-full bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600"
          >
            Quay lại đặt lịch
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingForm;