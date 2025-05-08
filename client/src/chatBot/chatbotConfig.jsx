import { createChatBotMessage } from "react-chatbot-kit";

const config = {
  initialMessages: [
    createChatBotMessage("Chào bạn! Tôi là trợ lý ảo của hệ thống đặt lịch. Tôi có thể giúp gì cho bạn hôm nay?", {
      withAvatar: true,
      delay: 500,
    }),
    createChatBotMessage("Bạn có thể chọn một trong các tùy chọn bên dưới:", {
      widget: "quickReplies",
      delay: 800,
    }),
  ],
  botName: "Booking Assistant",
  customStyles: {
    botMessageBox: {
      backgroundColor: "#3B82F6",
      color: "#FFFFFF",
      borderRadius: "12px",
      padding: "12px 16px",
      margin: "8px 0",
    },
    chatButton: {
      backgroundColor: "#3B82F6",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    },
    userMessageBox: {
      backgroundColor: "#F3F4F6",
      color: "#1F2937",
      borderRadius: "12px",
      padding: "12px 16px",
      margin: "8px 0",
    },
    widget: {
      backgroundColor: "#F3F4F6",
      borderRadius: "12px",
      padding: "12px",
      margin: "8px 0",
    },
  },
  widgets: [
    {
      widgetName: "quickReplies",
      widgetFunc: (props) => {
        const options = [
          { text: "Đặt lịch hẹn", value: "booking" },
          { text: "Hủy lịch hẹn", value: "cancel" },
          { text: "Kiểm tra trạng thái", value: "status" },
          { text: "Xem dịch vụ", value: "services" },
        ];
  
        return (
          <div className="quick-replies">
            <p className="text-sm text-gray-600 mb-2">Bạn có thể:</p>
            <div className="flex flex-wrap gap-2">
              {options.map(option => (
                <button
                  key={option.value}
                  onClick={() => props.actionProvider.handleQuickReply(option.value)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm font-medium px-3 py-1 rounded-full transition-colors"
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      widgetName: "confirmBooking",
      widgetFunc: (props) => {
        return (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => props.actionProvider.createChatBotMessage('Xác nhận', { withAvatar: false })}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
            >
              Xác nhận
            </button>
            <button
              onClick={() => props.actionProvider.createChatBotMessage('Hủy bỏ', { withAvatar: false })}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
            >
              Hủy bỏ
            </button>
          </div>
        );
      },
    },
  ],
  state: {
    isBooking: false,
    isCanceling: false,
    isChecking: false,
    bookingStep: null,
    isLoading: false,
  },
};

export default config;