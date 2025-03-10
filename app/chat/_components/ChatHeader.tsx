import React from 'react';

interface ChatHeaderProps {
  title?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  title = 'Assistente de Vendas Duhellen' 
}) => {
  return (
    <h1 className="text-3xl font-semibold text-center mb-8 text-white">
      {title}
    </h1>
  );
};

export default ChatHeader;