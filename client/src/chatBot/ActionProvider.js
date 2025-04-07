import axios from 'axios';

class ActionProvider {
  constructor(createChatBotMessage, setStateFunc) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
  }

  handleBooking() {
    const message = this.createChatBotMessage("Vui lòng cung cấp ngày và giờ bạn muốn đặt lịch (VD: 10h ngày 15/10).");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }

  handleCancel() {
    const message = this.createChatBotMessage("Vui lòng cung cấp mã lịch của bạn để hủy.");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }

  handleCheckStatus() {
    const message = this.createChatBotMessage("Vui lòng cung cấp mã lịch để kiểm tra.");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }

  handleDefault() {
    const message = this.createChatBotMessage("Tôi không hiểu ý bạn. Bạn muốn đặt lịch, hủy lịch hay kiểm tra?");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }
}

export default ActionProvider;