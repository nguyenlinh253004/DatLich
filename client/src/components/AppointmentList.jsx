import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
const AppointmentList = ({ token }) => {
  const [appointments, setAppointments] = useState([]);

  const fetchAppointments = async () => {
    const res = await axios.get('http://localhost:5000/api/appointments', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setAppointments(res.data);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn hủy lịch hẹn này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/appointments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Hủy lịch thành công');
        fetchAppointments(); // Cập nhật lại danh sách
      } catch (error) {
        toast.error('Hủy lịch thất bại');
      }
    }
  };

  return (
    <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
  <h2 className="text-xl font-semibold mb-4 text-gray-800">Danh sách lịch hẹn</h2>
      {appointments.length === 0 ? (
        <p className="text-gray-500">Chưa có lịch hẹn nào.</p>
      ) : (
        <ul className="space-y-2">
          {appointments.map((appt) => (
            <li key={appt._id} className="p-2 bg-gray-100 rounded flex justify-between items-center">
              <div>
                <p><strong>Dịch vụ:</strong> {appt.service}</p>
                <p><strong>Thời gian:</strong> {new Date(appt.date).toLocaleString()}</p>
                <p><strong>Họ tên:</strong> {appt.name}</p>
              </div>
              <button
                onClick={() => handleDelete(appt._id)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Hủy
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AppointmentList;