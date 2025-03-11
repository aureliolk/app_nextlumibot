import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai'; // Importar generateText em vez de streamText
import { z } from 'zod';
import prisma from '@/lib/db';
import { normalizeSearchText } from '@/lib/db';
import { NextResponse } from 'next/server';

// Cache para armazenar histórico de conversas por ID de usuário
const conversationCache: Record<string, { messages: any[] }> = {};

export const maxDuration = 30;

// Função para classificar a intenção da mensagem
function classifyMessage(message: string) {
  const intents = [
    {
      type: 'size_recommendation',
      keywords: ['tamanho', 'medir', 'medida', 'como escolher'],
      priority: 3
    },
    {
      type: 'product_search',
      keywords: ['sutia', 'calcinha', 'lingerie', 'sutiã'],
      priority: 2
    },
    {
      type: 'promotion_inquiry',
      keywords: ['desconto', 'promoção', 'cupom'],
      priority: 2
    },
    {
      type: 'general_assistance',
      keywords: ['ajuda', 'dúvida', 'como', 'o que'],
      priority: 1
    }
  ];

  const matches = intents.filter(intent =>
    intent.keywords.some(keyword =>
      message.toLowerCase().includes(keyword)
    )
  );

  return matches.length > 0
    ? matches.reduce((a, b) => a.priority > b.priority ? a : b).type
    : 'general_assistance';
}

export async function POST(req: Request) {
  try {
    const { message, userId } = await req.json();
    
    if (!message) {
      return NextResponse.json({ 
        error: 'Mensagem não fornecida' 
      }, { status: 400 });
    }
    
    const conversationId = userId || crypto.randomUUID();
    
    if (!conversationCache[conversationId]) {
      conversationCache[conversationId] = { messages: [] };
    }
    
    conversationCache[conversationId].messages.push({
      role: 'user',
      content: message
    });
    
    const intent = classifyMessage(message);
    
    // Usar generateText em vez de streamText
    const result = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'system',
          content: `Você é a DUH, uma consultora especializada de lingerie da Duhellen. 
          
          Diretrizes:
          - Seja empática e acolhedora
          - Use linguagem próxima e amigável 
          - Use emojis moderadamente
          
          Contexto:
          - Intenção Detectada: ${intent}
          - ID do Cliente: ${conversationId}
          
          IMPORTANTE: Responda no seguinte formato JSON:
          {
            "message": "Mensagem amigável e consultiva",
            "products": [
              {
                "name": "Nome do produto",
                "price": "PRECO do produto",
                "image": "URL da imagem",
                "url": "URL do produto"
              }
            ]
          }
          `
        },
        ...conversationCache[conversationId].messages
      ],
      tools: {
        searchProducts: tool({
          description: 'Buscar produtos por nome, descrição ou categoria',
          parameters: z.object({
            query: z.string().describe('Termos de busca'),
            limit: z.number().optional().default(5).describe('Número máximo de resultados'),
          }),
          execute: async ({ query, limit }) => {
            try {
              const normalizedQuery = normalizeSearchText(query);

              const products = await prisma.product.findMany({
                where: {
                  OR: [
                    { name: { contains: normalizedQuery, mode: 'insensitive' } },
                    { description: { contains: normalizedQuery, mode: 'insensitive' } },
                    {
                      categories: {
                        array_contains: normalizedQuery
                      }
                    }
                  ],
                  active: true,
                },
                take: limit,
                select: {
                  id: true,
                  name: true,
                  url: true,
                  price: true,
                  image: true,
                }
              });

              const formattedProducts = products.map(product => ({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price.toString()).toFixed(2),
                image: product.image,
                url: `https://duhellen.com.br/produtos/${product.url}`
              }));

              return {
                products: formattedProducts,
                count: formattedProducts.length
              };
            } catch (error) {
              console.error('Erro ao buscar produtos:', error);
              return {
                products: [],
                count: 0,
                error: 'Erro ao buscar produtos'
              };
            }
          },
        }),
      },
      maxSteps: 3,
    });
    const jsonData = JSON.parse(JSON.stringify(eval('(' + result.text + ')')));
    console.log(jsonData);
    
    return NextResponse.json(jsonData);
    
  } catch (error: any) {
    console.error('Erro na API:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}