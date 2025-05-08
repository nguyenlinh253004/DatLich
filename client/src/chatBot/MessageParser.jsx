class MessageParser {
  constructor(actionProvider, state) {
    this.actionProvider = actionProvider;
    this.state = state || {};
  }

  parse(message) {
    const lowerCaseMessage = message.toLowerCase();

    // Nếu đang trong quá trình đặt lịch
    if (this.state.isBooking) {
      this.actionProvider.processBookingInfo(message);
      return;
    }

    // Nếu đang trong quá trình hủy lịch
    if (this.state.isCanceling) {
      if (!message.trim()) {
        this.actionProvider.addMessageToState(
          this.actionProvider.createChatBotMessage(
            "Vui lòng nhập mã lịch hẹn để hủy. Mã phải là một chuỗi ký tự, ví dụ: APPT123."
          )
        );
        return;
      }
      this.actionProvider.processCancelRequest(message.trim());
      return;
    }

    // Nếu đang trong quá trình kiểm tra
    if (this.state.isChecking) {
      if (!message.trim()) {
        this.actionProvider.addMessageToState(
          this.actionProvider.createChatBotMessage(
            "Vui lòng nhập mã lịch hẹn để kiểm tra. Mã phải là một chuỗi ký tự, ví dụ: APPT123."
          )
        );
        return;
      }
      this.actionProvider.processCheckRequest(message.trim());
      return;
    }

    // Xử lý ý định từ tin nhắn
    if (
      lowerCaseMessage.includes("đặt lịch") ||
      lowerCaseMessage.includes("đặt hẹn") ||
      lowerCaseMessage.match(/muốn.*đặt|lịch|hẹn/)
    ) {
      this.actionProvider.handleBooking();
    } else if (
      lowerCaseMessage.includes("hủy lịch") ||
      lowerCaseMessage.includes("hủy hẹn") ||
      lowerCaseMessage.match(/muốn.*hủy/)
    ) {
      this.actionProvider.handleCancel();
    } else if (
      lowerCaseMessage.includes("kiểm tra") ||
      lowerCaseMessage.includes("trạng thái") ||
      lowerCaseMessage.includes("lịch sử")
    ) {
      this.actionProvider.handleCheckStatus();
    } else if (
      lowerCaseMessage.includes("dịch vụ") ||
      lowerCaseMessage.includes("có gì")
    ) {
      this.actionProvider.showServices();
    } else {
      this.actionProvider.handleDefault();
    }
  }
}

export default MessageParser;