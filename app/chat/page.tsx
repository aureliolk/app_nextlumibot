'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    maxSteps: 5, // Permitir até 5 chamadas de ferramentas por mensagem
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-gray-900 py-6 flex flex-col justify-center sm:py-12">
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-semibold text-center mb-8 text-white">
              Assistente de Vendas
            </h1>
            
            {/* Área de mensagens */}
            <div className="bg-gray-700 rounded-lg p-4 mb-6 h-[400px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-sm">Envie uma mensagem para começar a conversa...</p>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'user' ? (
                        <div className="max-w-[80%] p-3 rounded-lg bg-orange-600 text-white">
                          <p className="text-sm">{message.content}</p>
                        </div>
                      ) : (
                        <div className="max-w-[85%] p-4 rounded-lg bg-gray-600 text-gray-100">
                          {message.toolInvocations ? (
                            <div>
                              <p className="text-sm">{message.content}</p>
                              <div className="mt-2">
                                <div className="flex items-center space-x-2 text-xs text-gray-300">
                                  <div className="animate-pulse h-2 w-2 rounded-full bg-orange-500"></div>
                                  <span>Buscando informações...</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="prose prose-invert prose-sm max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  a: ({ node, ...props }) => (
                                    <a 
                                      {...props} 
                                      className="text-orange-400 hover:underline" 
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    />
                                  ),
                                  strong: ({ node, ...props }) => (
                                    <strong {...props} className="text-white font-semibold" />
                                  ),
                                  li: ({ node, ...props }) => (
                                    <li {...props} className="mb-3 pb-2 border-b border-gray-700" />
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Formulário de entrada */}
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Como posso ajudar você hoje?"
                className="w-full p-4 pr-24 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-2 bottom-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar
              </button>
            </form>
            
            <div className="mt-6 text-xs text-center text-gray-400">
              &copy; <a href="https://lumibot.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">Lumibot</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}