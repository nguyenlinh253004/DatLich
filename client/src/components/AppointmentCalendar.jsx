import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const initialAppointment = {
  service: '',
  date: '',
  name: '',
  phone: '',
  email: '',
  note: '',
};

const AppointmentCalendar = ({ token }) => {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '', confirmed: '' });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState(initialAppointment);
  const [editMode, setEditMode] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/services');
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

  // Fetch appointments
  const fetchAppointments = async (start, end) => {
    setLoading(true);
    try {
      console.log('Fetching appointments with:', { start, end, filters });
      const res = await axios.get('http://localhost:5000/api/appointments', {
        params: {
          start: start.toISOString(),
          end: end.toISOString(),
          limit: 1000,
          search: filters.search,
          status: filters.status,
          confirmed: filters.confirmed,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(res.data.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      toast.error('Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    const now = new Date();
    const start = moment(now).startOf('month').toDate();
    const end = moment(now).endOf('month').toDate();
    fetchAppointments(start, end);
  }, [filters, token]);

  // Generate time slots when date changes
  useEffect(() => {
    if (newAppointment.date) {
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
  }, [newAppointment.date]);

  // const handleNavigate = (newDate) => {
  //   console.log('Navigating to:', newDate);
  //   const start = moment(newDate).startOf('month').toDate();
  //   const end = moment(newDate).endOf('month').toDate();
  //   fetchAppointments(start, end);
  // };

  const events = useMemo(() => {
    return appointments
      ?.map((appt) => {
        if (!appt || !appt._id || !appt.date) return null;
        return {
          id: appt._id,
          title: `${appt.service || 'Dịch vụ'} - ${appt.name || 'Khách'} (${
            appt.confirmed === 'confirmed' ? 'Đã xác nhận' :
            appt.confirmed === 'rejected' ? 'Đã từ chối' : 'Chờ xác nhận'
          })`,
          start: new Date(appt.date),
          end: new Date(appt.date),
          allDay: false,
          data: appt,
        };
      })
      .filter(Boolean) || [];
  }, [appointments]);

  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: event.title.includes('Đã xác nhận')
        ? '#10B981'
        : event.title.includes('Đã từ chối')
        ? '#EF4444'
        : '#6B7280',
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
    };
    return { style };
  };

  // const isValidTimeSlot = (date) => {
  //   const hours = moment(date).hours();
  //   const minutes = moment(date).minutes();
  //   const isWithinHours = hours >= 8 && hours < 17;
  //   const isHalfHour = minutes === 0 || minutes === 30;
  //   return isWithinHours && isHalfHour;
  // };

  const isSunday = (date) => moment(date).day() === 0;

  const checkTimeSlotAvailability = async (appointmentDateTime,service) => {
    try {
      setCheckingAvailability(true);
      const res = await axios.post(
        'http://localhost:5000/api/appointments/check-availability',
        { date: appointmentDateTime ,service},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data.available;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi kiểm tra thời gian khả dụng');
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSelectSlot = ({ start }) => {
    const now = moment();
    if (moment(start).isBefore(now, 'day') || isSunday(start)) {
      toast.error(
        moment(start).isBefore(now, 'day')
          ? 'Không thể thêm lịch hẹn vào quá khứ!'
          : 'Không thể thêm lịch hẹn vào Chủ Nhật!'
      );
      return;
    }

    setNewAppointment({ ...initialAppointment, date: start.toISOString() });
    setEditMode(false);
    setShowModal(true);
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    const eventDate = moment(event.data.date);
    setNewAppointment({
      service: event.data.service,
      date: event.data.date,
      name: event.data.name,
      phone: event.data.phone || '',
      email: event.data.email || '',
      note: event.data.note || '',
    });
    setSelectedTime(eventDate.format('HH:mm'));
    setEditMode(true);
    setShowModal(true);
  };

  const handleEventDrop = async ({ event, start }) => {
    const now = moment();
    if (moment(start).isBefore(now, 'day') || isSunday(start)) {
      toast.error(
        moment(start).isBefore(now, 'day')
          ? 'Không thể di chuyển lịch hẹn vào quá khứ!'
          : 'Không thể di chuyển lịch hẹn vào Chủ Nhật!'
      );
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/appointments/${event.id}`,
        { date: start },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAppointments(
        moment(start).startOf('month').toDate(),
        moment(start).endOf('month').toDate()
      );
      toast.success('Cập nhật thời gian thành công');
    } catch (err) {
      toast.error('Lỗi khi cập nhật thời gian');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAppointment.service) {
      toast.warning('Vui lòng chọn dịch vụ');
      return;
    }
    if (!newAppointment.name) {
      toast.warning('Vui lòng nhập họ tên');
      return;
    }
    if (!isNaN(newAppointment.name)) {
      toast.warning('Tên không có số');
      return;
    }
    if (!newAppointment.phone) {
      toast.warning('Vui lòng nhập số điện thoại');
      return;
    }
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(newAppointment.phone)) {
      toast.warning('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại 10 chữ số bắt đầu bằng 0.');
      return;
    }
    if (!selectedTime) {
      toast.warning('Vui lòng chọn giờ hẹn');
      return;
    }

    const selectedDateTime = moment(newAppointment.date)
      .set({
        hour: parseInt(selectedTime.split(':')[0]),
        minute: parseInt(selectedTime.split(':')[1]),
        second: 0,
      })
      .toISOString();

    const now = moment();
    if (moment(selectedDateTime).isBefore(now, 'day') || isSunday(selectedDateTime)) {
      toast.error(
        moment(selectedDateTime).isBefore(now, 'day')
          ? 'Không thể thêm hoặc cập nhật lịch hẹn vào quá khứ!'
          : 'Không thể thêm hoặc cập nhật lịch hẹn vào Chủ Nhật!'
      );
      return;
    }

    const isAvailable = await checkTimeSlotAvailability(selectedDateTime,newAppointment.service);
    if (!isAvailable) {
      toast.error('Thời gian này đã được đặt. Vui lòng chọn thời gian khác.');
      return;
    }

    try {
      setCheckingAvailability(true);
      if (editMode) {
        await axios.put(
          `http://localhost:5000/api/appointments/${selectedEvent.id}`,
          { ...newAppointment, date: selectedDateTime },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Cập nhật lịch hẹn thành công');
      } else {
        await axios.post(
          'http://localhost:5000/api/appointments',
          { ...newAppointment, date: selectedDateTime },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Thêm lịch hẹn thành công');
      }
      setShowModal(false);
      setNewAppointment(initialAppointment);
      setSelectedTime('');
      fetchAppointments(
        moment(new Date()).startOf('month').toDate(),
        moment(new Date()).endOf('month').toDate()
      );
    } catch (err) {
      toast.error(editMode ? 'Lỗi khi cập nhật lịch hẹn' : err.response?.data?.message);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa lịch hẹn này?')) {
      try {
        await axios.delete(
          `http://localhost:5000/api/appointments/${selectedEvent.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Xóa lịch hẹn thành công');
        setShowModal(false);
        setNewAppointment(initialAppointment);
        setSelectedTime('');
        fetchAppointments(
          moment(new Date()).startOf('month').toDate(),
          moment(new Date()).endOf('month').toDate()
        );
      } catch (err) {
        toast.error('Lỗi khi xóa lịch hẹn');
      }
    }
  };

  const handleCancel = () => {
    setNewAppointment(initialAppointment);
    setSelectedTime('');
    setShowModal(false);
  };

  // Set minimum and maximum selectable times
  const minDate = new Date();
  minDate.setHours(8, 0, 0, 0); // 8:00 AM today

  const maxDate = new Date();
  maxDate.setHours(17, 0, 0, 0); // 5:00 PM today

  return (
    <div className="mt-8 container mx-auto px-4 py-8 font-roboto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Lịch biểu</h2>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc dịch vụ..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="border rounded-lg p-2 w-full sm:w-1/3"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="border rounded-lg p-2 w-full sm:w-1/4"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="upcoming">Sắp tới</option>
          <option value="past">Đã qua</option>
        </select>
        <select
          value={filters.confirmed}
          onChange={(e) => setFilters({ ...filters, confirmed: e.target.value })}
          className="border rounded-lg p-2 w-full sm:w-1/4"
        >
          <option value="">Tất cả xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="rejected">Đã từ chối</option>
          <option value="pending">Chờ xác nhận</option>
        </select>
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex justify-center items-center h mercenaries64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
          <p className="ml-4 text-gray-600 text-lg">Đang tải...</p>
        </div>
      ) : (
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          messages={{
            next: 'Tiếp theo',
            previous: 'Trước đó',
            today: 'Hôm nay',
            month: 'Tháng',
            week: 'Tuần',
            day: 'Ngày',
          }}
          views={['month', 'week', 'day']}
          defaultView="month"
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleEventSelect}
          draggableAccessor={() => true}
          onEventDrop={handleEventDrop}
          // onNavigate={handleNavigate}
          min={minDate}
          max={maxDate}
          step={30}
          timeslots={2}
          dateDisabled={({ date }) => isSunday(date)} // Disable Sundays
        />
      )}

      {/* Modal for Create/Edit Appointment */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-center text-blue-600">
              {editMode ? 'Chỉnh sửa lịch hẹn' : 'Thêm lịch hẹn mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ *</label>
                <select
                  name="service"
                  value={newAppointment.service}
                  onChange={(e) => setNewAppointment({ ...newAppointment, service: e.target.value })}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hẹn *</label>
                  <input
                    type="date"
                    value={moment(newAppointment.date).format('YYYY-MM-DD')}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ hẹn *</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                <input
                  type="text"
                  name='name'
                  value={newAppointment.name}
                  onChange={(e) => setNewAppointment({ ...newAppointment, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập họ tên đầy đủ"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                <input
                  type="number"
                  name='phone'
                  value={newAppointment.phone}
                  onChange={(e) => setNewAppointment({ ...newAppointment, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name='email'
                  value={newAppointment.email}
                  onChange={(e) => setNewAppointment({ ...newAppointment, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập email (nếu có)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={newAppointment.note}
                  onChange={(e) => setNewAppointment({ ...newAppointment, note: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ghi chú thêm (nếu có)"
                  rows="3"
                />
              </div>
              <div className="flex justify-end gap-2">
                {editMode && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                  >
                    Xóa
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || checkingAvailability}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading || checkingAvailability ? 'Đang xử lý...' : editMode ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;