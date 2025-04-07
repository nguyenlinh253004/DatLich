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
import Dashboard from './components/manager';
import Home from './components/Home';
import UploadHero from './components/UploadHero';
import AdminDashboard from './components/AdminDashboard';
import ChatbotComponent from './chatBot/Chatbot';
import Payment from './Payment/Payment';
import Stats from './components/stats';
import UserList from './components/UserList';
import AppointmentCalendar from './components/AppointmentCalendar';
import Setup2FA from './components/Setup2FA';
import { useNavigate } from 'react-router-dom';
function App() {
  const [services, setServices] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const userRole = localStorage.getItem('userRole'); // Giả sử bạn lưu userRole khi đăng nhập
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
        <Routes className="mt-10">
          
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/BookingForm" element={<BookingForm fetchAppointments={fetchAppointments} token={token} />} />
          <Route path="/AppointmentList"  element={<AppointmentList token={token} isAdmin={userRole === 'admin'} />} />
          <Route
            path="/"
            element={ 
                      <Home token={token}/>
            }
          />
          <Route path="/upload-hero" element={<UploadHero token={token} />} />
          <Route path="/admin/dashboard" element={<Dashboard token={token} />} />
          <Route path="/admin/stats" element={<Stats token={token} />} />
          <Route path="/admin/services" element={<AdminDashboard token={token} />} />
          <Route path="/payment/:id" element={<Payment token={token} onSuccess={() => navigate('/AppointmentList')} />} />
          
        <Route path="/admin/users" element={<UserList token={token} />} />
        <Route path="/admin/calendar" element={<AppointmentCalendar token={token} />} />
        <Route path="/setup-2fa" element={<Setup2FA token={token} />} />
        </Routes>
        <ChatbotComponent token={token} />
        <ToastContainer
  position="top-right"
  autoClose={3000}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  rtl={false}
  pauseOnFocusLoss
  draggable
  pauseOnHover
  style={{ zIndex: 9999 }}
/>
        </div>
      </div>
    </Router>
  );
}

export default App;