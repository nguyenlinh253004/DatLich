import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Định nghĩa các tài nguyên ngôn ngữ
const resources = {
  vi: {
    translation: {
      // Navbar
      navHome: "Trang chủ",
      navBookNow: "Đặt lịch ngay",

      // Hero Section (Home.jsx)
      heroTitle: "Trải Nghiệm Dịch Vụ Đẳng Cấp",
      heroSubtitle: "Hệ thống đặt lịch thông minh giúp bạn tiết kiệm thời gian và trải nghiệm dịch vụ tốt nhất",
      bookNow: "Đặt lịch ngay",

      // Features Section (Home.jsx)
      whyChooseUs: "Tại sao chọn chúng tôi?",
      whyChooseUsSubtitle: "Những lý do khiến chúng tôi trở thành lựa chọn hàng đầu",
      feature1Title: "Tiết kiệm thời gian",
      feature1Description: "Đặt lịch chỉ trong 30 giây với công nghệ hiện đại",
      feature2Title: "Xác nhận tức thì",
      feature2Description: "Nhận thông báo xác nhận qua email/SMS ngay lập tức",
      feature3Title: "Hỗ trợ 24/7",
      feature3Description: "Đội ngũ chăm sóc khách hàng luôn sẵn sàng",

      // Services Section (Home.jsx)
      servicesTitle: "Dịch vụ của chúng tôi",
      servicesSubtitle: "Những dịch vụ chất lượng cao dành riêng cho bạn",
      noServices: "Hiện chưa có dịch vụ nào",
      defaultServiceDescription: "Dịch vụ chất lượng cao với đội ngũ chuyên nghiệp",
      details: "Chi tiết",
      contactPrice: "Liên hệ",
      duration: "phút",

      // Testimonials Section (Home.jsx)
      testimonialsTitle: "Khách hàng nói gì về chúng tôi",
      testimonialsSubtitle: "Những đánh giá chân thực từ khách hàng",
      noTestimonials: "Chưa có đánh giá nào",
      customer: "Khách hàng",

      // CTA Section (Home.jsx)
      ctaTitle: "Sẵn sàng trải nghiệm dịch vụ?",
      ctaSubtitle: "Đăng ký ngay hôm nay để nhận ưu đãi đặc biệt cho lần đặt lịch đầu tiên",

      // Footer (Home.jsx)
      aboutUsTitle: "Về chúng tôi",
      aboutUsDescription: "Hệ thống đặt lịch hàng đầu với chất lượng dịch vụ đẳng cấp và công nghệ hiện đại.",
      contactTitle: "Liên hệ",
      contactAddress: "123 Đường ABC, Quận 1, TP.HCM",
      contactEmail: "Email: contact@dichvu.com",
      contactPhone: "Hotline: 1900 1234",
      workingHoursTitle: "Giờ làm việc",
      workingHours1: "Thứ 2 - Thứ 6: 8:00 - 18:00",
      workingHours2: "Thứ 7: 8:00 - 12:00",
      workingHours3: "Chủ nhật: Nghỉ",
      footerCopyright: "© {year} Dịch Vụ Đặt Lịch. All rights reserved.",

      // Service Modal (Home.jsx)
      close: "Đóng",
      noDescription: "Không có mô tả chi tiết.",

      // ChatbotComponent.jsx
      welcome: "Chào bạn! Tôi là trợ lý ảo của hệ thống đặt lịch. Tôi có thể giúp gì cho bạn hôm nay?",
      optionsPrompt: "Bạn có thể:",
      booking: "Đặt lịch hẹn",
      cancel: "Hủy lịch hẹn",
      status: "Kiểm tra trạng thái",
      services: "Xem dịch vụ",
      bookingInfo:
        "Vui lòng cung cấp thông tin đặt lịch theo định dạng sau:\n\n" +
        "📅 Ngày: [dd/mm/yyyy]\n" +
        "⏰ Giờ: [hh:mm]\n" +
        "💈 Dịch vụ: [Tên dịch vụ]\n\n" +
        "Ví dụ: Ngày: 20/10/2023, Giờ: 14:30, Dịch vụ: Cắt tóc",
      invalidFormat: "Thông tin chưa đầy đủ. Vui lòng nhập theo định dạng đã hướng dẫn.",
      serviceNotFound: "Dịch vụ không tồn tại. Vui lòng kiểm tra lại hoặc xem danh sách dịch vụ.",
      pastDate: "Thời gian đặt lịch không thể ở quá khứ. Vui lòng chọn thời gian khác.",
      timeNotAvailable: "Khung giờ này đã được đặt. Vui lòng chọn khung giờ khác.",
      confirmBooking: "Vui lòng xác nhận thông tin đặt lịch:\n\nDịch vụ: {service}\nThời gian: {time}\n\nBạn có muốn tiếp tục không?",
      yes: "Có",
      no: "Không",
      enterName: "Vui lòng cung cấp tên của bạn:",
      enterPhone: "Vui lòng cung cấp số điện thoại của bạn:",
      enterEmail: "Vui lòng cung cấp email của bạn:",
      invalidPhone: "Số điện thoại không hợp lệ. Vui lòng nhập lại (10 hoặc 11 số):",
      invalidEmail: "Email không hợp lệ. Vui lòng nhập lại:",
      bookingSuccess:
        "🎉 Đặt lịch thành công!\n\nMã lịch hẹn: {id}\nDịch vụ: {service}\nThời gian: {time}\n\nBạn sẽ nhận được email xác nhận trong ít phút nữa.",
      error: "Rất tiếc, có lỗi xảy ra: {error}\n\nVui lòng thử lại.",
      cancelCode: "Vui lòng nhập mã lịch hẹn bạn muốn hủy:",
      invalidCode: "Vui lòng nhập mã lịch hẹn hợp lệ.",
      cancelSuccess: "Lịch hẹn với mã {code} đã được hủy thành công.\n\nBạn có cần giúp gì thêm không?",
      statusCode: "Vui lòng nhập mã lịch hẹn để kiểm tra trạng thái:",
      statusResult:
        "Thông tin lịch hẹn:\n\nMã lịch hẹn: {code}\nDịch vụ: {service}\nThời gian: {time}\nTrạng thái: {status}\n\nBạn có cần giúp gì thêm không?",
      showServices: "Chúng tôi có các dịch vụ sau:\n\n",
      serviceItem: "🔹 {name} - {price} VND\n   {description}\n\n",
      languagePrompt: "Chọn ngôn ngữ:",
      vietnamese: "Tiếng Việt",
      english: "Tiếng Anh",
      restoreHistoryPrompt: "Bạn có muốn tiếp tục từ lịch sử trò chuyện trước không?",
      historyRestored: "Đã khôi phục lịch sử trò chuyện.",
      chatbotHeader: "Trợ lý đặt lịch",
      chatbotPlaceholder: "Nhập tin nhắn...",
    },
  },
  en: {
    translation: {
      // Navbar
      navHome: "Home",
      navBookNow: "Book Now",

      // Hero Section (Home.jsx)
      heroTitle: "Experience Premium Service",
      heroSubtitle: "A smart booking system that saves you time and delivers the best service experience",
      bookNow: "Book Now",

      // Features Section (Home.jsx)
      whyChooseUs: "Why Choose Us?",
      whyChooseUsSubtitle: "The reasons we are your top choice",
      feature1Title: "Save Time",
      feature1Description: "Book in just 30 seconds with modern technology",
      feature2Title: "Instant Confirmation",
      feature2Description: "Receive instant confirmation via email/SMS",
      feature3Title: "24/7 Support",
      feature3Description: "Our customer support team is always ready",

      // Services Section (Home.jsx)
      servicesTitle: "Our Services",
      servicesSubtitle: "High-quality services tailored for you",
      noServices: "No services available at the moment",
      defaultServiceDescription: "High-quality service with a professional team",
      details: "Details",
      contactPrice: "Contact",
      duration: "minutes",

      // Testimonials Section (Home.jsx)
      testimonialsTitle: "What Our Customers Say",
      testimonialsSubtitle: "Real feedback from our customers",
      noTestimonials: "No reviews yet",
      customer: "Customer",

      // CTA Section (Home.jsx)
      ctaTitle: "Ready to Experience Our Services?",
      ctaSubtitle: "Sign up today to receive special offers for your first booking",

      // Footer (Home.jsx)
      aboutUsTitle: "About Us",
      aboutUsDescription: "A leading booking system with top-quality service and modern technology.",
      contactTitle: "Contact",
      contactAddress: "123 ABC Street, District 1, HCMC",
      contactEmail: "Email: contact@service.com",
      contactPhone: "Hotline: 1900 1234",
      workingHoursTitle: "Working Hours",
      workingHours1: "Monday - Friday: 8:00 AM - 6:00 PM",
      workingHours2: "Saturday: 8:00 AM - 12:00 PM",
      workingHours3: "Sunday: Closed",
      footerCopyright: "© {year} Booking Service. All rights reserved.",

      // Service Modal (Home.jsx)
      close: "Close",
      noDescription: "No detailed description available.",

      // ChatbotComponent.jsx
      welcome: "Hello! I am the virtual assistant for the booking system. How can I assist you today?",
      optionsPrompt: "You can:",
      booking: "Book an appointment",
      cancel: "Cancel an appointment",
      status: "Check status",
      services: "View services",
      bookingInfo:
        "Please provide booking information in the following format:\n\n" +
        "📅 Date: [dd/mm/yyyy]\n" +
        "⏰ Time: [hh:mm]\n" +
        "💈 Service: [Service name]\n\n" +
        "Example: Date: 20/10/2023, Time: 14:30, Service: Haircut",
      invalidFormat: "Information is incomplete. Please enter in the specified format.",
      serviceNotFound: "Service not found. Please check again or view the service list.",
      pastDate: "The appointment time cannot be in the past. Please choose another time.",
      timeNotAvailable: "This time slot is already booked. Please choose another time.",
      confirmBooking: "Please confirm your booking details:\n\nService: {service}\nTime: {time}\n\nWould you like to proceed?",
      yes: "Yes",
      no: "No",
      enterName: "Please provide your name:",
      enterPhone: "Please provide your phone number:",
      enterEmail: "Please provide your email:",
      invalidPhone: "Invalid phone number. Please enter again (10 or 11 digits):",
      invalidEmail: "Invalid email. Please enter again:",
      bookingSuccess:
        "🎉 Booking successful!\n\nAppointment ID: {id}\nService: {service}\nTime: {time}\n\nYou will receive a confirmation email shortly.",
      error: "Sorry, an error occurred: {error}\n\nPlease try again.",
      cancelCode: "Please enter the appointment code you want to cancel:",
      invalidCode: "Please enter a valid appointment code.",
      cancelSuccess: "Appointment with code {code} has been canceled successfully.\n\nDo you need further assistance?",
      statusCode: "Please enter the appointment code to check its status:",
      statusResult:
        "Appointment details:\n\nAppointment ID: {code}\nService: {service}\nTime: {time}\nStatus: {status}\n\nDo you need further assistance?",
      showServices: "We offer the following services:\n\n",
      serviceItem: "🔹 {name} - {price} VND\n   {description}\n\n",
      languagePrompt: "Select language:",
      vietnamese: "Vietnamese",
      english: "English",
      restoreHistoryPrompt: "Would you like to continue from your previous chat history?",
      historyRestored: "Chat history restored.",
      chatbotHeader: "Booking Assistant",
      chatbotPlaceholder: "Type a message...",
    },
  },
};

// Khởi tạo i18next
i18n
  .use(LanguageDetector) // Tự động phát hiện ngôn ngữ
  .use(initReactI18next) // Tích hợp với React
  .init({
    resources,
    fallbackLng: 'vi', // Ngôn ngữ mặc định là tiếng Việt
    interpolation: {
      escapeValue: false, // Không cần escape HTML trong React
    },
    detection: {
      order: ['localStorage', 'navigator'], // Thứ tự ưu tiên để phát hiện ngôn ngữ
      caches: ['localStorage'], // Lưu ngôn ngữ vào localStorage
    },
  });

export default i18n;