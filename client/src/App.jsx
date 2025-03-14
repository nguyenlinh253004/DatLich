import { useState, useEffect } from 'react';
import axios from 'axios';
import BookingForm from './components/BookingForm';
import AppointmentList from './components/AppointmentList';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Register from './components/Register';
function App() {
  const [services, setServices] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:5000/api/services', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => setServices(res.data))
        .catch((err) => console.log(err));
    }
  }, [token]);
    
  const fetchAppointments = async () => {
    const res = await axios.get('http://localhost:5000/api/appointments', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  };
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className='max-w-7xl mx-auto p-6 shadow-lg bg-white rounded-lg'>
        <Navbar token={token} setToken={setToken} />
        <Routes>
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/BookingForm" element={<BookingForm fetchAppointments={fetchAppointments} token={token} />} />
          <Route path="/AppointmentList" element={<AppointmentList token={token}/>} />
          <Route
            path="/"
            element={ 
                      <div>
                        <h1 className="text-2xl font-bold mb-4">Đặt lịch hẹn</h1>
                          
                      </div>
            }
          />
        </Routes>
        <ToastContainer />
        </div>
      </div>
    </Router>
  );
}

export default App;