import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from 'ai';

interface Product {
  id?: number;
  name: string;
  price: string;
  image?: string | null;
  url?: string;
}

interface StructuredResponse {
  message: string;
  products?: Product[];
}

// Função para extrair JSON de blocos de código markdown
const extractJsonFromMarkdown = (text: string): StructuredResponse | null => {
  try {
    // Tenta encontrar conteúdo JSON entre blocos de código
    const jsonRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/;
    const match = text.match(jsonRegex);
    
    if (match && match[1]) {
      // Se encontrou um bloco de código JSON, analisa-o
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      
      // Verifica se tem a estrutura esperada
      if (typeof parsed.message === 'string') {
        return parsed as StructuredResponse;
      }
    }
    
    // Se não houver blocos de código, tenta analisar o texto diretamente
    // (isso é um fallback e geralmente não será necessário)
    if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
      const parsed = JSON.parse(text);
      if (typeof parsed.message === 'string') {
        return parsed as StructuredResponse;
      }
    }

    return null;
  } catch (e) {
    console.error('Erro ao analisar JSON:', e);
    return null;
  }
};

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
      {messages.map((message) => {
        // Verificamos se é mensagem do assistente e tentamos extrair JSON
        if (message.role === 'assistant') {
          const structuredContent = extractJsonFromMarkdown(message.content);
          
          if (structuredContent) {
            return (
              <div key={message.id} className="flex justify-start">
                <div className="max-w-[85%] w-full p-4 rounded-lg bg-gray-600 text-gray-100">
                  {/* Mensagem principal */}
                  <p className="text-sm mb-4">{structuredContent.message}</p>
                  
                  {/* Lista de produtos, se existir */}
                  {structuredContent.products && structuredContent.products.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {structuredContent.products.map((product, index) => (
                        <div key={index} className="border border-gray-500 rounded-lg p-3 flex flex-col">
                          {product.image && (
                            <div className="mb-2">
                              <img 
                                src="https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081" 
                                alt={product.name}
                                className="w-full h-32 object-cover rounded"
                                onError={(e) => {
                                  // Fallback para imagem placeholder se a original falhar
                                  (e.target as HTMLImageElement).src = 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081';
                                }}
                              />
                            </div>
                          )}
                          <h3 className="font-semibold text-white">{product.name}</h3>
                          <p className="text-orange-300">R$ {product.price}</p>
                          {product.url && (
                            <a 
                              href={product.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 text-center bg-orange-600 hover:bg-orange-700 text-white py-1 px-3 rounded text-xs"
                            >
                              Ver detalhes
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }
        }
        
        // Renderização padrão para mensagens não estruturadas ou do usuário
        return (
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
                          <li {...props} className="mb-1" />
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
                        ),
                        // Esconde os blocos de código que contêm JSON
                        code: ({ node, inline, className, children, ...props }: any) => {
                          if (inline) {
                            return <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>;
                          }
                          
                          // Verifica se é um bloco de código JSON
                          const content = String(children).trim();
                          if (content.startsWith('{') && content.includes('"message"')) {
                            // Não renderiza blocos JSON pois já foram processados
                            return null;
                          }
                          
                          return (
                            <pre className="bg-gray-800 p-2 rounded text-sm overflow-x-auto">
                              <code {...props}>{children}</code>
                            </pre>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessageList;