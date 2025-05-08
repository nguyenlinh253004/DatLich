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
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentId, setAppointmentId] = useState(null);
  const [selectedServicePrice, setSelectedServicePrice] = useState(0);
  const [showPayment, setShowPayment] = useState(false);

  const isSunday = (date) => date.getDay() === 0;

  useEffect(() => {
    const fetchServices = async () => {
      try {
        
        const res = await axios.get(`http://localhost:5000/api/services`);
        if (Array.isArray(res.data)) {
          setServices(res.data);
        } else {
          throw new Error('Dữ liệu dịch vụ không hợp lệ');
        }
      } catch (err) {
        toast.error('Không thể tải danh sách dịch vụ');
        console.error(err);
      }
    };
    fetchServices();
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'service') {
      const selectedService = services.find((s) => s.name === value);
      setSelectedServicePrice(selectedService?.price || 0);
    }
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, date });
    setSelectedTime('');
    setShowCalendar(false);
  };

  const checkTimeSlotAvailability = async (appointmentDateTime) => {
    try {
      setCheckingAvailability(true);
      
      const res = await axios.post(
        `http://localhost:5000/api/appointments/check-availability`,
        { date: appointmentDateTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data.available;
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        toast.error(err.response?.data?.message || 'Lỗi khi kiểm tra thời gian khả dụng');
      }
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra dữ liệu đầu vào
    if (!formData.service) {
      toast.warning('Vui lòng chọn dịch vụ');
      return;
    }
    if (!formData.name) {
      toast.warning('Vui lòng nhập họ tên');
      return;
    }
    if (!formData.phone) {
      toast.warning('Vui lòng nhập số điện thoại');
      return;
    }
    if (!validatePhoneNumber(formData.phone)) {
      toast.warning('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại 10 chữ số bắt đầu bằng 0.');
      return;
    }
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

      // Kiểm tra thời gian khả dụng
      const isAvailable = await checkTimeSlotAvailability(appointmentDateTime);
      if (!isAvailable) {
        toast.error('Thời gian này đã được đặt. Vui lòng chọn thời gian khác.');
        return;
      }

      
      const res = await axios.post(
        `http://localhost:5000/api/appointments`,
        {
          ...formData,
          date: appointmentDateTime,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.data.appointment?._id) {
        throw new Error('Không nhận được ID lịch hẹn từ server');
      }

      toast.success('Đặt lịch thành công! Vui lòng chọn phương thức thanh toán.');
      setAppointmentId(res.data.appointment._id);
      setShowPayment(true);
      setFormData({
        service: '',
        date: new Date(),
        name: '',
        phone: '',
        email: '',
        note: '',
      });
      setSelectedTime('');
      // Không reset selectedServicePrice ở đây để giữ giá trị cho Payment
      fetchAppointments();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setAppointmentId(null);
    setShowPayment(false);
    setSelectedServicePrice(0); // Reset giá dịch vụ sau khi thanh toán thành công
    toast.success('Lịch hẹn đã được xác nhận.');
    fetchAppointments();
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">ĐẶT LỊCH HẸN</h2>

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
            disabled={loading || checkingAvailability}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || checkingAvailability ? 'Đang xử lý...' : 'ĐẶT LỊCH NGAY'}
          </button>
        </form>
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-center text-green-600">
            Đặt lịch thành công! Vui lòng chọn phương thức thanh toán.
          </h3>

          {/* {showPayment && (
            <div className="mt-4">
              <Payment
                appointmentId={appointmentId}
                amount={selectedServicePrice}
                token={token}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          )} */}

          <button
            onClick={() => {
              setAppointmentId(null);
              setShowPayment(false);
              setSelectedServicePrice(0); // Reset giá dịch vụ khi quay lại
            }}
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