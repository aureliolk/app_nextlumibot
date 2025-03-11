import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from 'ai';
import ProductList from './ProductList';

interface Product {
  id?: number;
  name: string;
  price: string;
  image?: string | null;
  url?: string;
  color?: string;
  size?: string;
  detailsUrl?: string;
}

interface StructuredResponse {
  message: string;
  products?: Product[];
}

// Função avançada para interpretar conteúdo estruturado
const parseStructuredResponse = (text: string): StructuredResponse | null => {
  // Verificar se temos texto para processar
  if (!text || typeof text !== 'string') {
    console.warn('Texto inválido para parsear', text);
    return { message: 'Não foi possível carregar a resposta', products: [] };
  }

  try {
    // Procurar por blocos de código JSON na mensagem
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const jsonMatch = text.match(jsonRegex);
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        const jsonContent = jsonMatch[1].trim();
        const parsed = JSON.parse(jsonContent);
        
        if (typeof parsed.message === 'string') {
          return {
            message: parsed.message,
            products: Array.isArray(parsed.products) ? parsed.products.map(normalizeProduct) : []
          };
        }
      } catch (jsonError) {
        console.warn('Falha ao parsear JSON de bloco de código', jsonError);
      }
    }
    
    // Caso o texto inteiro seja JSON
    if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(text.trim());
        if (typeof parsed.message === 'string') {
          return {
            message: parsed.message,
            products: Array.isArray(parsed.products) ? parsed.products.map(normalizeProduct) : []
          };
        }
      } catch (jsonError) {
        console.warn('Falha ao parsear texto como JSON', jsonError);
      }
    }
    
    // Se chegamos aqui, o texto não é JSON válido, então tratamos como texto simples
    return {
      message: text,
      products: []
    };
  } catch (e) {
    console.warn('Erro ao processar resposta:', e);
    return {
      message: text,
      products: []
    };
  }
};

// Função para normalizar o formato do produto
const normalizeProduct = (product: any): Product => {
  return {
    id: product.id,
    name: product.name || 'Produto',
    price: product.price || '0.00',
    image: product.image || null,
    url: product.url || null,
    color: product.color || '',
    size: product.size || '',
    detailsUrl: product.url || product.detailsUrl || '#'
  };
};

// Componente de lista de mensagens com melhorias
export default function ChatMessageList({ messages }: { messages: Message[] }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [contextMemory, setContextMemory] = useState<{
    lastProductViewed?: Product,
    conversationIntent?: string
  }>({});

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gerenciamento de memória de contexto
  useEffect(() => {
    const lastAssistantMessage : any = messages
      .filter(m => m.role === 'assistant')
      .pop();

    if (lastAssistantMessage) {
      const structuredResponse : any = parseStructuredResponse(lastAssistantMessage.content);
      
      if (structuredResponse?.products && structuredResponse.products.length > 0) {
        setContextMemory(prev => ({
          ...prev,
          lastProductViewed: structuredResponse.products[0] 
        }));
      }
    }
    console.log(contextMemory);
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm text-center">
          Olá! 👋 Sou a DUH, sua consultora de lingerie. 
          <br />Me conte o que está procurando! 💕
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {messages.map((message) => {
        // Mensagens do usuário
        if (message.role === 'user') {
          return (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[80%] p-3 rounded-lg bg-orange-600 text-white">
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          );
        }
        
        // Processamento de mensagens do assistente
        if (message.role === 'assistant') {
          // Tenta processar como resposta estruturada
          const structuredResponse = parseStructuredResponse(message.content);
          
          if (structuredResponse) {
            return (
              <div key={message.id} className="flex justify-start">
                <div className="max-w-[85%] w-full p-4 rounded-lg bg-gray-600 text-gray-100">
                  {/* Mensagem principal */}
                  <div className="mb-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {structuredResponse.message}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Lista de produtos, se existir */}
                  {structuredResponse.products && structuredResponse.products.length > 0 && (
                    <div className="mt-3 border-t border-gray-500 pt-3">
                      <ProductList 
                        products={structuredResponse.products.map(p => ({
                          name: p.name,
                          price: p.price,
                          color: p.color || '',
                          size: p.size || '',
                          image: p.image || '',
                          detailsUrl: p.url || p.detailsUrl || '#'
                        }))} 
                        introText="Aqui estão algumas opções que podem te interessar:"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          }
          
          // Fallback para mensagens de texto simples
          return (
            <div key={message.id} className="flex justify-start">
              <div className="max-w-[85%] p-4 rounded-lg bg-gray-600 text-gray-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          );
        }
        
        // Outros tipos de mensagens (caso existam no futuro)
        return null;
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};  