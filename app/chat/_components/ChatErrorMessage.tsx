import React from 'react';

interface ChatErrorMessageProps {
  message: string;
}

const ChatErrorMessage: React.FC<ChatErrorMessageProps> = ({ message }) => {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 
      bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
      {message}
    </div>
  );
};

export default ChatErrorMessage;