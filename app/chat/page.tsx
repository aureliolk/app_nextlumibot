'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';

// Importar componentes
import ChatHeader from './_components/ChatHeader';
import ChatErrorMessage from './_components/ChatErrorMessage';
import ChatMessageList from './_components/ChatMessageList';
import ChatFooter from './_components/ChatFooter';

export default function ChatPage() {
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading,
    error 
  } = useChat({
    api: '/api/chat',
    id: 'duhellen-chat',
    maxSteps: 5,
  });
  
  const [chatError, setChatError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tratamento de erros
  useEffect(() => {
    if (error) {
      setChatError('Ops! Algo deu errado. Por favor, tente novamente.');
      console.error('Erro no chat:', error);
    }
  }, [error]);

  // Limpar erro após 3 segundos
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    if (chatError) {
      timeoutId = setTimeout(() => {
        setChatError(null);
      }, 3000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [chatError]);

  // Focar no input quando o carregamento terminar ou quando as mensagens mudarem
  useEffect(() => {
    // Apenas focar se não estiver carregando e se temos alguma mensagem
    if (!isLoading && messages.length > 0 && inputRef.current) {
      // Pequeno delay para garantir que outros processos sejam concluídos
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, messages.length]);

  // Focar no input quando a página carrega
  useEffect(() => {
    // Pequeno delay para garantir que o componente esteja totalmente renderizado
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 py-6 flex flex-col justify-center sm:py-12">
      <div className="w-full max-w-4xl mx-auto px-4">
        {/* Mensagem de erro */}
        {chatError && <ChatErrorMessage message={chatError} />}

        <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Cabeçalho */}
            <ChatHeader />
            
            {/* Área de mensagens */}
            <div className="bg-gray-700 rounded-lg p-4 mb-6 h-[600px] overflow-y-auto">
              <ChatMessageList messages={messages} />
            </div>
            
            {/* Input de mensagem - Agora com ref para foco automático */}
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Como posso ajudar você hoje? Procurando alguma lingerie específica?"
                className="w-full p-4 pr-24 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-2 bottom-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processando...
                  </div>
                ) : (
                  'Enviar'
                )}
              </button>
            </form>
            
            {/* Rodapé */}
            <ChatFooter />
          </div>
        </div>
      </div>
    </div>
  );
}