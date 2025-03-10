'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';

// Importar componentes
import ChatHeader from './_components/ChatHeader';
import ChatErrorMessage from './_components/ChatErrorMessage';
import ChatMessageList from './_components/ChatMessageList';
import ChatInput from './_components/ChatInput';
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
    maxSteps: 5, // Permitir até 5 chamadas de ferramentas por mensagem
    
    // Use systemMessage em vez de initial
    initialMessages: [
      {
        id: 'system-prompt',
        role: 'system',
        content: `Você é um assistente de vendas especializado em lingerie Duhellen.
        Objetivos:
        - Entender as necessidades do cliente
        - Oferecer recomendações personalizadas
        - Ser empático e informativo
        
        Comportamento:
        - Use linguagem amigável e próxima
        - Faça perguntas para entender melhor o cliente
        - Sugira produtos relevantes
        - Destaque benefícios e características`
      }
    ]
  });
  
  const [chatError, setChatError] = useState<string | null>(null);

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

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Limpar erro anterior
    setChatError(null);
    
    try {
      await handleSubmit(e);
    } catch (submitError) {
      console.error('Erro ao enviar mensagem:', submitError);
      setChatError('Não foi possível enviar sua mensagem. Tente novamente.');
    }
  };

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
            <div className="bg-gray-700 rounded-lg p-4 mb-6 h-[400px] overflow-y-auto">
              <ChatMessageList messages={messages} />
            </div>
            
            {/* Entrada de mensagem */}
            <ChatInput 
              input={input}
              isLoading={isLoading}
              handleInputChange={handleInputChange}
              handleSubmit={handleFormSubmit}
            />
            
            {/* Rodapé */}
            <ChatFooter />
          </div>
        </div>
      </div>
    </div>
  );
}