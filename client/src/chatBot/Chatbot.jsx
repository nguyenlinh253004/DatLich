import React, { useState } from 'react';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import config from './chatbotConfig';
import MessageParser from './MessageParser';
import ActionProvider from './ActionProvider';
import { FaComment, FaTimes } from 'react-icons/fa'; // Import biểu tượng từ react-icons

const ChatbotComponent = () => {
  const [isOpen, setIsOpen] = useState(false); // State để kiểm soát trạng thái mở/thu nhỏ

  // Hàm toggle chatbot
  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Nút toggle khi chatbot thu nhỏ */}
      {!isOpen && (
        <button
          onClick={toggleChatbot}
          className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          aria-label="Mở chatbot"
        >
          <FaComment size={24} />
        </button>
      )}

      {/* Chatbot khi được mở */}
      {isOpen && (
        <div className="relative bg-white rounded-lg shadow-lg w-80">
          {/* Nút thu nhỏ */}
          <button
            onClick={toggleChatbot}
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            aria-label="Thu nhỏ chatbot"
          >
            <FaTimes size={20} />
          </button>

          {/* Chatbot */}
          <Chatbot
            config={config}
            messageParser={MessageParser}
            actionProvider={ActionProvider}
          />
        </div>
      )}
    </div>
  );
};

export default ChatbotComponent;