import React, { useState, useEffect } from 'react';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import config from './chatbotConfig';
import MessageParser from './MessageParser';
import ActionProvider from './ActionProvider';
import { FaComment, FaTimes, FaSpinner } from 'react-icons/fa';

const ChatbotComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const chatContainer = document.querySelector('.react-chatbot-kit-chat-message-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [isOpen]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={toggleChatbot}
          className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition-all transform hover:scale-110"
          aria-label="Mở chatbot"
        >
          <FaComment size={28} />
        </button>
      ) : (
        <div className="relative bg-white rounded-xl shadow-2xl w-96 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <h3 className="font-bold text-lg">Trợ lý đặt lịch</h3>
            <button
              onClick={toggleChatbot}
              className="text-white hover:text-gray-200"
              aria-label="Thu nhỏ chatbot"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-10">
              <FaSpinner className="animate-spin text-white text-2xl" />
            </div>
          )}

          {/* Chatbot */}
          <div className="flex flex-col h-96">
            <div className="flex-1 overflow-y-auto">
              <Chatbot
                config={config}
                messageParser={MessageParser}
                actionProvider={ActionProvider}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotComponent;