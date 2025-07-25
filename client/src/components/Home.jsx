import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Bỏ useAnimation vì không cần nữa
import { FiClock, FiCheckCircle, FiPhone, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaQuoteLeft, FaStar } from 'react-icons/fa';
// import { FaGlobe } from 'react-icons/fa';

const Home = ({ token }) => {

  // State management
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [heroImage, setHeroImage] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState(0);
  
  const testimonialInterval = useRef();
  const featureInterval = useRef();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [servicesRes, testimonialsRes, heroRes] = await Promise.all([
          axios.get('http://localhost:5000/api/services', { 
            headers: token ? { Authorization: `Bearer ${token}` } : {} 
          }),
          axios.get('http://localhost:5000/api/testimonials'),
          axios.get('http://localhost:5000/api/hero-image')
        ]);
        
        setServices(servicesRes.data);
        setTestimonials(testimonialsRes.data);
        setHeroImage(heroRes.data.heroImage);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Auto-rotate testimonials and features
  useEffect(() => {
    if (!isPaused && testimonials.length > 0) {
      testimonialInterval.current = setInterval(() => {
        setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
      }, 5000);
    }

    featureInterval.current = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 8000);

    return () => {
      clearInterval(testimonialInterval.current);
      clearInterval(featureInterval.current);
    };
  }, [testimonials.length, isPaused]);

  // Features data
  const features = [
    {
      icon: <FiClock className="w-8 h-8" />,
      title: "Tiết kiệm thời gian",
      Description: "Đặt lịch chỉ trong 30 giây với công nghệ hiện đại"
    },
    {
      icon: <FiCheckCircle className="w-8 h-8" />,
      title: "Xác nhận tức thì",
      Description: "Nhận thông báo xác nhận qua email/SMS ngay lập tức"
    },
    {
      icon: <FiPhone className="w-8 h-8" />,
      title: "Hỗ trợ 24/7",
      Description: "Đội ngũ chăm sóc khách hàng luôn sẵn sàng"
    }
  ];

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 }
    })
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        type: "spring",
        damping: 25,
        stiffness: 300
      } 
    },
    exit: { opacity: 0, scale: 0.9 }
  };

  const featureVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0
    })
  };

  // Progress bar variants
  const progressVariants = {
    initial: { width: '0%' },
    animate: { width: '100%' }
  };

  // Render stars for testimonials
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <FaStar 
        key={i} 
        className={`${i < rating ? 'text-yellow-400' : 'text-gray-300'} inline-block`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] bg-gray-900 overflow-hidden">
        {heroImage && (
          <img 
            src={heroImage} 
            alt="Hero background" 
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
        )}
        
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Trải Nghiệm Dịch Vụ <span className="text-blue-400">Đẳng Cấp</span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Hệ thống đặt lịch thông minh giúp bạn tiết kiệm thời gian và trải nghiệm dịch vụ tốt nhất
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link
              to="/BookingForm"
              className="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Đặt lịch ngay
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Tại sao chọn chúng tôi?
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Những lý do khiến chúng tôi trở thành lựa chọn hàng đầu
            </p>
          </div>

          <div className="relative h-64 md:h-72 lg:h-80">
            <AnimatePresence custom={1}>
              <motion.div
                key={activeFeature}
                custom={1}
                variants={featureVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div className="bg-blue-100 p-4 rounded-full mb-6">
                  {features[activeFeature].icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {features[activeFeature].title}
                </h3>
                <p className="text-lg text-gray-600 max-w-md text-center">
                  {features[activeFeature].Description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center mt-8 space-x-2">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveFeature(index)}
                className={`w-3 h-3 rounded-full transition-colors ${index === activeFeature ? 'bg-blue-600' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Dịch vụ của chúng tôi
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Những dịch vụ chất lượng cao dành riêng cho bạn
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Hiện chưa có dịch vụ nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={service._id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                       src={`http://localhost:5000${service.image}`} 
                      alt={service.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-4">
                      <h3 className="text-xl font-bold text-white">{service.name}</h3>
                      <p className="text-blue-200 font-medium">
                        {service.price?.toLocaleString() || 'Liên hệ'} VND
                      </p>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {service.Description || 'Dịch vụ chất lượng cao với đội ngũ chuyên nghiệp'}
                    </p>
                    <div className="flex justify-between">
                      <button
                        onClick={() => setSelectedService(service)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Chi tiết
                      </button>
                      <Link
                        to="/BookingForm"
                        state={{ serviceId: service._id }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Đặt ngay
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        className="py-16 bg-white"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Khách hàng nói gì về chúng tôi
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Những đánh giá chân thực từ khách hàng
            </p>
          </div>

          {testimonials.length > 0 ? (
            <div className="relative max-w-3xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gray-50 p-8 md:p-10 rounded-xl shadow-sm"
                >
                  <FaQuoteLeft className="text-blue-200 text-4xl mb-6" />
                  <blockquote className="text-lg md:text-xl text-gray-700 italic mb-6">
                    "{testimonials[currentTestimonial].quote}"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {testimonials[currentTestimonial].author.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-base font-medium text-gray-900">
                        {testimonials[currentTestimonial].author}
                      </div>
                      <div className="text-sm text-gray-500">
                        {testimonials[currentTestimonial].position || 'Khách hàng'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    {renderStars(testimonials[currentTestimonial].rating || 5)}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Progress bar */}
              <motion.div
                key={currentTestimonial} // Reset animation khi currentTestimonial thay đổi
                className="h-1.5 bg-blue-100 rounded-full mt-6"
                variants={progressVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 5, ease: 'linear' }}
              />

              {/* Navigation */}
              <div className="flex justify-center mt-6 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrentTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
              >
                <FiChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => setCurrentTestimonial(prev => (prev + 1) % testimonials.length)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
              >
                <FiChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Chưa có đánh giá nào</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold mb-6">Sẵn sàng trải nghiệm dịch vụ?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Đăng ký ngay hôm nay để nhận ưu đãi đặc biệt cho lần đặt lịch đầu tiên
          </p>
          <Link
            to="/BookingForm"
            className="inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
          >
            Đặt lịch ngay
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Về chúng tôi</h3>
              <p className="text-gray-400">
                Hệ thống đặt lịch hàng đầu với chất lượng dịch vụ đẳng cấp và công nghệ hiện đại.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Liên hệ</h3>
              <ul className="space-y-2 text-gray-400">
                <li>123 Đường ABC, Quận 1, TP.HCM</li>
                <li>Email: contact@dichvu.com</li>
                <li>Hotline: 1900 1234</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Giờ làm việc</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Thứ 2 - Thứ 6: 8:00 - 18:00</li>
                <li>Thứ 7: 8:00 - 12:00</li>
                <li>Chủ nhật: Nghỉ</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Dịch Vụ Đặt Lịch. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Service Modal */}
    {/* Service Modal - Phiên bản cải tiến */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedService(null)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header với hình ảnh và nút đóng */}
              <div className="relative">
                <div className="h-64 w-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-xl overflow-hidden">
                  <img
                    src={`http://localhost:5000${selectedService.image}`}
                    alt={selectedService.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <button
                  onClick={() => setSelectedService(null)}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all transform hover:scale-110"
                  aria-label="Đóng"
                >
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Nội dung chi tiết */}
              <div className="p-6 md:p-8">
                {/* Tiêu đề và giá */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                      {selectedService.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <FiClock className="mr-1" />
                      <span>{selectedService.duration || 60} phút</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span className="text-2xl font-bold text-blue-600">
                      {selectedService.price?.toLocaleString('vi-VN') || 'Liên hệ'} VND
                    </span>
                  </div>
                </div>

                {/* Mô tả chi tiết */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Mô tả dịch vụ</h4>
                  <div className="prose max-w-none text-gray-600">
                    {selectedService.Description || 'Không có mô tả chi tiết.'}
                  </div>
                </div>

                {/* Lợi ích (nếu có) */}
                {selectedService.benefits && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Lợi ích</h4>
                    <ul className="space-y-2">
                      {selectedService.benefits.split('\n').map((benefit, i) => (
                        <li key={i} className="flex items-start">
                          <svg className="flex-shrink-0 w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-600">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quy trình (nếu có) */}
                {selectedService.procedure && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Quy trình thực hiện</h4>
                    <div className="prose max-w-none text-gray-600">
                      {selectedService.procedure}
                    </div>
                  </div>
                )}

                {/* Các nút hành động */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
                  <Link
                    to="/BookingForm"
                    state={{ serviceId: selectedService._id }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-center py-3 px-6 rounded-lg font-medium shadow-md transition-all transform hover:scale-[1.02]"
                  >
                    Đặt lịch ngay
                  </Link>
                  <button
                    onClick={() => setSelectedService(null)}
                    className="flex-1 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    Xem thêm dịch vụ khác
                  </button>
                </div>
              </div>

              {/* Footer modal */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
                <div className="flex items-center justify-center">
                  <FiPhone className="text-blue-500 mr-2" />
                  <span className="text-gray-600">Cần hỗ trợ? Gọi ngay: </span>
                  <a href="tel:19001234" className="text-blue-600 font-medium ml-1 hover:underline">1900 1234</a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;