import React from 'react';

const ChatFooter: React.FC = () => {
  return (
    <div className="mt-6 text-xs text-center text-gray-400">
      &copy; <a 
        href="https://lumibot.com.br" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="hover:text-orange-400 transition-colors"
      >
        Lumibot
      </a> | Assistente de Vendas
    </div>
  );
};

export default ChatFooter;