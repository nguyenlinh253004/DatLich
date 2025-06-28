import { useState, useEffect } from 'react';
import axios from 'axios';
import BookingForm from './components/BookingForm';
import AppointmentList from './components/AppointmentList';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Route, Routes, useNavigate } from 'react-router-dom';
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
import UserProfile from './components/InforUser';
import PaymentHistory from './components/PaymentHistory';
import { refreshAccessToken } from './utils/auth';
import { toast } from 'react-toastify';
function App() {

  const [token, setToken] = useState(localStorage.getItem('accessToken') || '');
  const userRole = localStorage.getItem('userRole'); // Giả sử bạn lưu userRole khi đăng nhập
  const navigate = useNavigate();
  // Thiết lập interceptor khi component mount
  useEffect(() => {
    // Interceptor cho request
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor cho response
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Nếu lỗi 401 và chưa thử refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newAccessToken = await refreshAccessToken();
            setToken(newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Nếu refresh thất bại, đăng xuất người dùng
            handleLogout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      // Cleanup interceptors khi component unmount
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const handleLogout = () => {
    // Gọi API logout phía server nếu cần
    axios.post('http://localhost:5000/api/logout', {
      refreshToken: localStorage.getItem('refreshToken')
    }).catch(console.error);

    // Xóa tất cả dữ liệu local
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    setToken('');
    navigate('/login');
    toast.success("Đăng xuất thành công")
  };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/appointments');
      return res.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  };
  return (
    
      <div className="min-h-screen bg-gray-50">
        <div className='max-w-7xl mx-auto p-6 shadow-lg bg-white rounded-lg'>
        <Navbar token={token} setToken={setToken} onLogout={handleLogout}/>
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
          <Route path="/payment-history" element={<PaymentHistory token={token} />} />
        <Route path="/admin/users" element={<UserList token={token} />} />
        <Route path="/admin/calendar" element={<AppointmentCalendar token={token} />} />
        <Route path="/setup-2fa" element={<Setup2FA token={token} />} />
        <Route path="/UserProfile" element={<UserProfile  token={token}/>} />
        </Routes>
        <ChatbotComponent/>
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
  );
}

export default App;