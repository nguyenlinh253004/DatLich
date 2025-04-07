import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const AppointmentCalendar = ({ token }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/appointments',
         {
          params: {
            limit: 1000, // Tăng limit lên rất lớn
            // Hoặc thêm calendarMode: true để backend bỏ qua phân trang
          },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(res.data.data);
    } catch (err) {
      toast.error('Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  const events = appointments?.map((appt) => {
    if (!appt || !appt._id || !appt.date) return null;
    return {
      id: appt._id,
      title: `${appt.service || 'Dịch vụ'} - ${appt.name || 'Khách'} (${appt.confirmed === 'confirmed' ? 'Đã xác nhận' : appt.confirmed === 'rejected' ? 'Đã từ chối' : 'Chờ xác nhận'})`,
      start: new Date(appt.date),
      end: new Date(appt.date),
      allDay: false,
    };
  }).filter(Boolean) || [];

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

  return (
    <div className="container mx-auto px-4 py-8 font-roboto mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Lịch biểu</h2>
      {loading ? (
        <div className="flex justify-center items-center h-64">
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
          onSelectEvent={(event) => toast.info(`Lịch hẹn: ${event.title}`)}
        />
      )}
    </div>
  );
};

export default AppointmentCalendar;