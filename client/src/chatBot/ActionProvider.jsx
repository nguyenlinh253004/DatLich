import axios from 'axios';
import axiosRetry from 'axios-retry';

class ActionProvider {
  constructor(createChatBotMessage, setStateFunc) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
    this.userData = {};
    this.API_URL = 'http://localhost:5000/api';
    this.token = localStorage.getItem('token') || 'your_token_here';
    axiosRetry(axios, { retries: 3, retryDelay: (retryCount) => retryCount * 1000 });
    axios.defaults.timeout = 10000;
  }

  handleQuickReply = (option) => {
    switch (option) {
      case 'booking':
        this.handleBooking();
        break;
      case 'cancel':
        this.handleCancel();
        break;
      case 'status':
        this.handleCheckStatus();
        break;
      case 'services':
        this.showServices();
        break;
      default:
        this.handleDefault();
    }
  };

  async handleBooking() {
    this.setState(prev => ({
      ...prev,
      isBooking: true,
      isCanceling: false,
      isChecking: false,
      bookingStep: 'enterDetails',
      isLoading: false,
    }));

    const message = this.createChatBotMessage(
      "Vui lòng cung cấp thông tin đặt lịch theo định dạng sau:\n\n" +
      "📅 Ngày: [dd/mm/yyyy]\n" +
      "⏰ Giờ: [hh:mm]\n" +
      "💈 Dịch vụ: [Tên dịch vụ]\n\n" +
      "Ví dụ: Ngày: 20/10/2023, Giờ: 14:30, Dịch vụ: Cắt tóc"
    );

    this.addMessageToState(message);
  }

  async handleCancel() {
    this.setState(prev => ({
      ...prev,
      isBooking: false,
      isCanceling: true,
      isChecking: false,
      cancelCode: null,
      isLoading: false,
    }));

    const message = this.createChatBotMessage(
      "Vui lòng nhập mã lịch hẹn bạn muốn hủy. " +
      "Bạn có thể tìm thấy mã này trong email xác nhận hoặc trang lịch sử đặt lịch của bạn."
    );

    this.addMessageToState(message);
  }

  async handleCheckStatus() {
    this.setState(prev => ({
      ...prev,
      isBooking: false,
      isCanceling: false,
      isChecking: true,
      checkCode: null,
      isLoading: false,
    }));

    const message = this.createChatBotMessage(
      "Vui lòng nhập mã lịch hẹn để kiểm tra trạng thái. " +
      "Nếu bạn không nhớ mã, tôi có thể liệt kê các lịch hẹn gần đây của bạn."
    );

    this.addMessageToState(message);
  }

  handleError(errorMessage) {
    const message = this.createChatBotMessage(
      `Rất tiếc, có lỗi xảy ra: ${errorMessage}\n\n` +
      "Bạn vui lòng thử lại hoặc liên hệ bộ phận hỗ trợ qua số điện thoại 0123.456.789"
    );

    this.addMessageToState(message);
    this.setState(prev => ({ ...prev, isLoading: false }));
  }

  handleDefault() {
    const message = this.createChatBotMessage(
      "Xin lỗi, tôi chưa hiểu yêu cầu của bạn. Bạn có thể:\n\n" +
      "1. Đặt lịch hẹn mới\n" +
      "2. Hủy lịch hẹn\n" +
      "3. Kiểm tra trạng thái lịch hẹn\n" +
      "4. Xem danh sách dịch vụ\n\n" +
      "Vui lòng chọn một trong các tùy chọn trên.",
      { widget: "quickReplies" }
    );

    this.addMessageToState(message);
    this.setState(prev => ({ ...prev, isLoading: false }));
  }

  async showServices() {
    this.setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await axios.get(`${this.API_URL}/services`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const services = response.data;

      let servicesMessage = "Chúng tôi có các dịch vụ sau:\n\n";
      services.forEach(service => {
        servicesMessage += `🔹 ${service.name} - ${service.price} VND\n`;
        servicesMessage += `   ${service.description || 'Không có mô tả'}\n\n`;
      });

      const message = this.createChatBotMessage(servicesMessage);
      this.addMessageToState(message);
    } catch (error) {
      this.handleError("Không thể tải danh sách dịch vụ");
    } finally {
      this.setState(prev => ({ ...prev, isLoading: false }));
    }
  }

  handleBookingSuccess(appointment) {
    const message = this.createChatBotMessage(
      `🎉 Đặt lịch thành công!\n\n` +
      `Mã lịch hẹn: ${appointment._id}\n` +
      `Dịch vụ: ${appointment.service}\n` +
      `Thời gian: ${new Date(appointment.date).toLocaleString('vi-VN')}\n\n` +
      `Bạn sẽ nhận được email xác nhận trong ít phút nữa.`
    );

    this.addMessageToState(message);
    this.setState(prev => ({
      ...prev,
      isBooking: false,
      bookingStep: null,
      isLoading: false,
    }));
  }

  addMessageToState(message) {
    this.setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }

  async processBookingInfo(message) {
    const step = this.state.bookingStep;

    if (step === 'enterDetails') {
      const dateMatch = message.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      const timeMatch = message.match(/(\d{1,2}:\d{2})/);
      const serviceMatch = message.match(/Dịch vụ:\s*(.+)/i);

      if (!dateMatch || !timeMatch || !serviceMatch) {
        this.addMessageToState(
          this.createChatBotMessage(
            "Thông tin chưa đầy đủ. Vui lòng nhập theo định dạng:\n\n" +
            "📅 Ngày: [dd/mm/yyyy]\n" +
            "⏰ Giờ: [hh:mm]\n" +
            "💈 Dịch vụ: [Tên dịch vụ]\n\n" +
            "Ví dụ: Ngày: 20/10/2023, Giờ: 14:30, Dịch vụ: Cắt tóc"
          )
        );
        return;
      }

      this.setState(prev => ({ ...prev, isLoading: true }));
      try {
        const servicesRes = await axios.get(`${this.API_URL}/services`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        const serviceExists = servicesRes.data.some(s =>
          s.name.toLowerCase() === serviceMatch[1].toLowerCase()
        );

        if (!serviceExists) {
          this.addMessageToState(
            this.createChatBotMessage("Dịch vụ không tồn tại. Vui lòng kiểm tra lại hoặc xem danh sách dịch vụ.")
          );
          this.showServices();
          return;
        }

        const [day, month, year] = dateMatch[0].split('/');
        const [hours, minutes] = timeMatch[0].split(':');
        const appointmentDate = new Date(year, month - 1, day, hours, minutes);

        if (appointmentDate < new Date()) {
          this.addMessageToState(
            this.createChatBotMessage("Thời gian đặt lịch không thể trong quá khứ. Vui lòng chọn thời gian khác.")
          );
          return;
        }

        const availabilityRes = await axios.post(
          `${this.API_URL}/appointments/check-availability`,
          { date: appointmentDate.toISOString() },
          { headers: { Authorization: `Bearer ${this.token}` } }
        );

        if (!availabilityRes.data.available) {
          this.addMessageToState(
            this.createChatBotMessage("Thời gian này đã được đặt. Vui lòng chọn thời gian khác.")
          );
          return;
        }

        this.userData.bookingInfo = {
          service: serviceMatch[1],
          date: appointmentDate,
          name: this.userData.name || '',
          phone: this.userData.phone || '',
          email: this.userData.email || '',
        };

        if (!this.userData.name) {
          this.setState(prev => ({ ...prev, bookingStep: 'enterName' }));
          this.addMessageToState(this.createChatBotMessage("Vui lòng cho biết tên của bạn:"));
        } else if (!this.userData.phone) {
          this.setState(prev => ({ ...prev, bookingStep: 'enterPhone' }));
          this.addMessageToState(this.createChatBotMessage("Vui lòng cung cấp số điện thoại của bạn:"));
        } else if (!this.userData.email) {
          this.setState(prev => ({ ...prev, bookingStep: 'enterEmail' }));
          this.addMessageToState(this.createChatBotMessage("Vui lòng cung cấp email của bạn:"));
        } else {
          this.confirmBooking();
        }
      } catch (err) {
        this.handleError("Có lỗi khi xử lý đặt lịch.");
      } finally {
        this.setState(prev => ({ ...prev, isLoading: false }));
      }
    } else if (step === 'enterName') {
      this.userData.name = message.trim();
      this.setState(prev => ({ ...prev, bookingStep: 'enterPhone' }));
      this.addMessageToState(this.createChatBotMessage("Vui lòng cung cấp số điện thoại của bạn:"));
    } else if (step === 'enterPhone') {
      const phoneRegex = /^\d{10,11}$/;
      if (!phoneRegex.test(message.trim())) {
        this.addMessageToState(this.createChatBotMessage("Số điện thoại không hợp lệ. Vui lòng nhập lại (10 hoặc 11 số):"));
        return;
      }
      this.userData.phone = message.trim();
      this.setState(prev => ({ ...prev, bookingStep: 'enterEmail' }));
      this.addMessageToState(this.createChatBotMessage("Vui lòng cung cấp email của bạn:"));
    } else if (step === 'enterEmail') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(message.trim())) {
        this.addMessageToState(this.createChatBotMessage("Email không hợp lệ. Vui lòng nhập lại:"));
        return;
      }
      this.userData.email = message.trim();
      this.confirmBooking();
    } else if (step === 'confirm') {
      this.processBookingConfirmation(message);
    }
  }

  async confirmBooking() {
    const { service, date, name, phone, email } = this.userData.bookingInfo;

    this.addMessageToState(
      this.createChatBotMessage(
        `Vui lòng xác nhận thông tin đặt lịch:\n\n` +
        `Dịch vụ: ${service}\n` +
        `Thời gian: ${new Date(date).toLocaleString('vi-VN')}\n` +
        `Tên: ${name}\n` +
        `Số điện thoại: ${phone}\n` +
        `Email: ${email}\n\n` +
        `Bạn có muốn xác nhận không?`,
        { widget: "confirmBooking" }
      )
    );

    this.setState(prev => ({ ...prev, bookingStep: 'confirm' }));
  }

  async processBookingConfirmation(response) {
    if (response.toLowerCase().includes('xác nhận')) {
      const { service, date, name, phone, email } = this.userData.bookingInfo;
      this.setState(prev => ({ ...prev, isLoading: true }));
      try {
        const res = await axios.post(
          `${this.API_URL}/appointments`,
          { service, date: date.toISOString(), name, phone, email },
          { headers: { Authorization: `Bearer ${this.token}` } }
        );

        this.handleBookingSuccess(res.data.appointment);
      } catch (error) {
        this.handleError(error.response?.data?.message || error.message);
      } finally {
        this.setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      this.addMessageToState(
        this.createChatBotMessage("Đã hủy bỏ đặt lịch. Bạn có muốn đặt lại không?", {
          widget: "quickReplies",
        })
      );
      this.setState(prev => ({
        ...prev,
        isBooking: false,
        bookingStep: null,
      }));
    }
  }

  async processCancelRequest(code) {
    this.setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await axios.delete(
        `${this.API_URL}/appointments/${code}`,
        { headers: { Authorization: `Bearer ${this.token}` } }
      );

      this.addMessageToState(
        this.createChatBotMessage(
          `Lịch hẹn với mã ${code} đã được hủy thành công.\n\n` +
          `Bạn có cần giúp gì thêm không?`,
          { widget: "quickReplies" }
        )
      );

      this.setState(prev => ({
        ...prev,
        isCanceling: false,
        cancelCode: null,
      }));
    } catch (error) {
      this.handleError(error.response?.data?.message || "Không thể hủy lịch hẹn. Vui lòng kiểm tra mã.");
    } finally {
      this.setState(prev => ({ ...prev, isLoading: false }));
    }
  }

  async processCheckRequest(code) {
    this.setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await axios.get(
        `${this.API_URL}/appointments/${code}`,
        { headers: { Authorization: `Bearer ${this.token}` } }
      );

      const { service, date, status } = response.data;
      this.addMessageToState(
        this.createChatBotMessage(
          `Thông tin lịch hẹn:\n\n` +
          `Mã lịch hẹn: ${code}\n` +
          `Dịch vụ: ${service}\n` +
          `Thời gian: ${new Date(date).toLocaleString('vi-VN')}\n` +
          `Trạng thái: ${status}\n\n` +
          `Bạn có cần giúp gì thêm không?`,
          { widget: "quickReplies" }
        )
      );

      this.setState(prev => ({
        ...prev,
        isChecking: false,
        checkCode: null,
      }));
    } catch (error) {
      this.handleError(error.response?.data?.message || "Không tìm thấy lịch hẹn. Vui lòng kiểm tra mã.");
    } finally {
      this.setState(prev => ({ ...prev, isLoading: false }));
    }
  }
}

export default ActionProvider;
