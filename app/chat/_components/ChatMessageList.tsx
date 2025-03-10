import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from 'ai';

interface ChatMessageListProps {
  messages: Message[];
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm text-center">
          Olá! Estou aqui para ajudar você a encontrar a lingerie perfeita. 
          <br />Me conte o que está procurando.
        </p>
      </div>
    );
  }

  return (
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
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto">
                          <table 
                            {...props} 
                            className="w-full border-collapse border border-gray-600 mb-4"
                          />
                        </div>
                      ),
                      th: ({ node, ...props }) => (
                        <th 
                          {...props} 
                          className="border border-gray-600 p-2 bg-gray-700 text-left"
                        />
                      ),
                      td: ({ node, ...props }) => (
                        <td 
                          {...props} 
                          className="border border-gray-600 p-2"
                        />
                      )
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
  );
};

export default ChatMessageList;