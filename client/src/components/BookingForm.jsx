import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
const BookingForm = ({ fetchAppointments, token }) => {
  const [service, setService] = useState('');
  const [date, setDate] = useState(new Date());
  const [name, setName] = useState('');
  const [services, setServices] = useState([]);
  useEffect(()=>{
        axios.get('http://localhost:5000/api/services')
           .then((res)=>setServices(res.data))
           .catch((err)=>console.log(err))
  },[])

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/appointments', { service, date, name }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(res.data.message);
      setService('');
      setDate(new Date());
      setName('');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  return (
    <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Đặt lịch hẹn</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Chọn dịch vụ</label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-52 p-2 border rounded"
            required
          >
            <option value="" className=''>-- Chọn dịch vụ --</option>
            {services.map((s) => (
              <option key={s._id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Họ tên</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Chọn ngày giờ</label>
          <Calendar
            onChange={setDate}
            value={date}
            className="border rounded p-2 w-full"
            minDate={new Date()}
          />
        </div>
       
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Đặt lịch
        </button>
       
      </form>
    </div>
  );
};

export default BookingForm;