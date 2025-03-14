import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
const Navbar = ({ token, setToken }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken('');
    toast.success('Đăng xuất thành công');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-blue-500 p-4 text-white">
      <div className="max-w-7xl  flex justify-between items-center mr-4 ml-4">
        <div className="text-lg font-bold">Đặt Lịch Hẹn</div>
        {token ? (
          <div className="space-x-4">
            <Link to="/" className="hover:underline">Trang chủ</Link>
            <Link to="/BookingForm" className="hover:underline">Đặt lịch</Link>
            <Link to="/AppointmentList" className="hover:underline">Lịch hẹn</Link>
            <button onClick={handleLogout} className="hover:underline">Đăng xuất</button>
          </div>
        ) : (
          <div className="space-x-4">
            <Link to="/login" className="hover:underline">Đăng nhập</Link>
            <Link to="/register" className="hover:underline">Đăng ký</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;