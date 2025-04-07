import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, 
  FaCalendarAlt, 
  FaList, 
  FaSignOutAlt,
  FaUser,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { IoMdArrowDropdown } from 'react-icons/io';

const Navbar = ({ token, setToken }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [user, setUser] = useState('');
  const navigate = useNavigate();

  // Fetch user data when token changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      
      try {
        const response = await axios.get('http://localhost:5000/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data.name);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Handle error (e.g., invalid token)
        handleLogout();
      }
    };

    fetchUserData();
  }, [token]);

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    setUser('');
    navigate('/login');
  };

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  };

  // Animation variants
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.2,
        ease: "easeOut"
      } 
    },
    exit: { 
      opacity: 0, 
      y: -10,
      transition: { 
        duration: 0.15 
      } 
    }
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: "auto",
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      } 
    },
    exit: { 
      opacity: 0, 
      height: 0,
      transition: { 
        duration: 0.25 
      } 
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg fixed left-0 top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link 
            to={token ? '/' : '/login'} 
            className="flex-shrink-0 flex items-center text-white font-bold text-xl"
            onClick={closeAllMenus}
          >
            <span className="hidden sm:inline">Hệ Thống Đặt Lịch</span>
            <span className="sm:hidden">Đặt Lịch</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {token ? (
              <div className="relative ml-3">
                <button
                  className="flex items-center text-sm rounded-full text-white focus:outline-none hover:bg-blue-700 px-3 py-2 transition-colors duration-200"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  onMouseEnter={() => setIsUserDropdownOpen(true)}
                  aria-haspopup="true"
                  aria-expanded={isUserDropdownOpen}
                >
                  <FaUser className="mr-2" />
                  <span className="mr-1">{user || 'Tài khoản'}</span>
                  <IoMdArrowDropdown className={`transition-transform duration-200 ${isUserDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isUserDropdownOpen && (
                    <motion.div
                      className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      onMouseLeave={() => setIsUserDropdownOpen(false)}
                    >
                      <div className="py-1">
                        <Link
                          to="/"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-t-md"
                          onClick={closeAllMenus}
                        >
                          <FaHome className="mr-3" />
                          Trang chủ
                        </Link>
                        <Link
                          to="/BookingForm"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                          onClick={closeAllMenus}
                        >
                          <FaCalendarAlt className="mr-3" />
                          Đặt lịch hẹn
                        </Link>
                        <Link
                          to="/AppointmentList"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                          onClick={closeAllMenus}
                        >
                          <FaList className="mr-3" />
                          Danh sách lịch hẹn
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-b-md"
                        >
                          <FaSignOutAlt className="mr-3" />
                          Đăng xuất
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-700 transition-colors duration-200"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/Register"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Mở menu chính</span>
              {isMobileMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden bg-blue-700"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {token ? (
                <>
                  <Link
                    to="/"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600"
                    onClick={closeAllMenus}
                  >
                    <FaHome className="mr-3" />
                    Trang chủ
                  </Link>
                  <Link
                    to="/BookingForm"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600"
                    onClick={closeAllMenus}
                  >
                    <FaCalendarAlt className="mr-3" />
                    Đặt lịch hẹn
                  </Link>
                  <Link
                    to="/AppointmentList"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600"
                    onClick={closeAllMenus}
                  >
                    <FaList className="mr-3" />
                    Danh sách lịch hẹn
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-white hover:bg-red-600"
                  >
                    <FaSignOutAlt className="mr-3" />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600"
                    onClick={closeAllMenus}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/Register"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-500"
                    onClick={closeAllMenus}
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;