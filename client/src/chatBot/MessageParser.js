class MessageParser {
    constructor(actionProvider) {
      this.actionProvider = actionProvider;
    }
  
    parse(message) {
      const lowerCaseMessage = message.toLowerCase();
  
      if (lowerCaseMessage.includes("đặt lịch")) {
        this.actionProvider.handleBooking();
      } else if (lowerCaseMessage.includes("hủy lịch")) {
        this.actionProvider.handleCancel();
      } else if (lowerCaseMessage.includes("kiểm tra")) {
        this.actionProvider.handleCheckStatus();
      } else {
        this.actionProvider.handleDefault();
      }
    }
  }
  
  export default MessageParser;