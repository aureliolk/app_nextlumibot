import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import prisma from '@/lib/db';
import { normalizeSearchText } from '@/lib/db';
import { NextResponse } from 'next/server';

// Permitir respostas streaming por até 30 segundos
export const maxDuration = 30;

// Tipos de ferramentas avançadas
interface SizeRecommendationTool {
  bust: number;
  torax: number;
}

interface PromotionCheckTool {
  productId: number;
}

// Classificação avançada de intenção
function advancedIntentClassification(message: string) {
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

  // Encontrar intenções correspondentes
  const matchedIntents = intents.filter(intent =>
    intent.keywords.some(keyword =>
      message.toLowerCase().includes(keyword)
    )
  );

  // Retornar a intenção de maior prioridade
  return matchedIntents.length > 0
    ? matchedIntents.reduce((a, b) => a.priority > b.priority ? a : b).type
    : 'general_assistance';
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // Verificar se temos mensagens para processar
  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'Nenhuma mensagem fornecida' }, { status: 400 });
  }
  
  // Caso contrário, usar o fluxo normal para o front-end
  const lastMessage = messages[messages.length - 1].content;

  // Classificação avançada de intenção
  const intent = advancedIntentClassification(lastMessage);
  const result = streamText({
    model: openai('gpt-4o'),
    messages: [
      {
        role: 'system',
        content: `Você é a DUH, uma consultora especializada de lingerie da Duhellen. 

        Diretrizes de Atendimento:
        - Seja empática e acolhedora
        - Use linguagem próxima e amigável 
        - Use emojis moderadamente
        - Foque em entender a real necessidade do cliente
        - Ofereça soluções personalizadas

        Contexto da Interação:
        - Intenção Detectada: ${intent}
        
        FORMATO DE RESPOSTA:
        Use JSON estruturado para respostas que incluam produtos:
        \`\`\`json
        {
          "message": "Mensagem amigável e consultiva",
          "products": [
            {
              "name": "Nome do produto",
              "price": "79.90",
              "image": "URL da imagem",
              "url": "URL do produto"
            }
          ]
        }
        \`\`\`

        Regras Especiais:
        - Sempre personalizar a resposta
        - Sugerir produtos complementares quando possível
        - Manter respostas concisas (máximo 2 parágrafos)
        - Incluir dicas de estilo e consultoria
        `
      },
      ...messages
    ],
    tools: {
      // Ferramenta de busca de produtos
      searchProducts: tool({
        description: 'Buscar produtos por nome, descrição ou categoria',
        parameters: z.object({
          query: z.string().describe('Termos de busca'),
          limit: z.number().optional().default(5).describe('Número máximo de resultados'),
        }),
        execute: async ({ query, limit }) => {
          try {
            // Normalizar a consulta (agora retorna múltiplos termos de busca relacionados)
            const normalizedQuery = normalizeSearchText(query);
            console.log("Termos de busca expandidos:", normalizedQuery);
            
            // Dividir em palavras individuais para busca
            const searchTerms = normalizedQuery.split(' ').filter(term => term.length >= 2);
            
            // Construir condições de busca para cada termo
            const searchConditions = searchTerms.map(term => ({
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } },
                { categories: { array_contains: term } }
              ]
            }));
            
            // Buscar produtos, exigindo que correspondam a pelo menos um dos termos de busca
            const products = await prisma.product.findMany({
              where: {
                OR: searchConditions as any,
                active: true,
              },
              take: limit,
              select: {
                id: true,
                name: true,
                url: true,
                price: true,
                image: true,
                categories: true,
                variations: true,
              }
            });
            
            console.log(`Encontrados ${products.length} produtos para a busca "${query}"`);
            
            // Formatar os produtos com informações adicionais
            const formattedProducts = products.map((product: any) => {
              // Extrair informações de variação quando disponíveis
              const color = product.variations && 
                product.variations.find((v: any) => v.name?.toLowerCase() === 'cor')?.value || '';
              
              const size = product.variations && 
                product.variations.find((v: any) => v.name?.toLowerCase() === 'tamanho')?.value || '';
              
              return {
                id: product.id,
                name: product.name,
                price: parseFloat(product.price?.toString() || "0").toFixed(2),
                image: product.image,
                url: `https://duhellen.com.br/produtos/${product.url}`,
                // Adicionar informações adicionais quando disponíveis
                color: color,
                size: size,
                category: product.categories?.[0] || ''
              };
            });

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

      // Ferramenta de recomendação de tamanho
      calculateSizeRecommendation: tool({
        description: 'Calcular tamanho ideal de sutiã baseado em medidas',
        parameters: z.object({
          bust: z.number().describe('Medida do busto em cm'),
          torax: z.number().describe('Medida do tórax em cm')
        }),
        execute: async ({ bust, torax }) => {
          // Lógica baseada na tabela de medidas do prompt original
          const sizeTable = [
            { size: 'PP', bustRange: [74, 80], toraxRange: [66, 70] },
            { size: 'P', bustRange: [81, 85], toraxRange: [70, 74] },
            { size: 'M', bustRange: [85, 92], toraxRange: [76, 80] },
            { size: 'G', bustRange: [92, 100], toraxRange: [80, 86] },
            { size: 'GG', bustRange: [100, 106], toraxRange: [87, 93] }
          ];

          const recommendedSize = sizeTable.find(
            entry =>
              bust >= entry.bustRange[0] && bust <= entry.bustRange[1] &&
              torax >= entry.toraxRange[0] && torax <= entry.toraxRange[1]
          );

          return {
            recommendedSize: recommendedSize ? recommendedSize.size : 'Não foi possível determinar',
            details: `Busto: ${bust}cm, Tórax: ${torax}cm`
          };
        }
      }),

      // Ferramenta de verificação de promoções
      checkPromotions: tool({
        description: 'Verificar promoções disponíveis para produtos',
        parameters: z.object({
          productId: z.number().optional().describe('ID do produto para verificar promoções específicas')
        }),
        execute: async ({ productId }) => {
          // Lógica simplificada de promoções
          const activePromotions = [
            {
              code: 'CARNADUH',
              discount: 10,
              description: 'Desconto especial de Carnaval'
            },
            {
              code: 'FRETEDUH',
              type: 'shipping',
              description: 'Frete grátis em compras acima de R$99,00'
            }
          ];

          // Se um produto específico for passado, poderia adicionar lógica de promoção por produto
          return {
            promotions: activePromotions,
            applicableToProduct: productId ? true : false
          };
        }
      })
    },
    maxSteps: 3,
  });

  const response = result.toDataStreamResponse();
  const reader = response?.body?.getReader();
  const decoder = new TextDecoder();
  let fullMessage = '';

  async function readStream() {
    while (true) {
      const { done, value }: any = await reader?.read();
      if (done) break;

      const chunk = decoder.decode(value);
      if (chunk.startsWith('0:')) {
        fullMessage += chunk;
      }
    }
    return fullMessage; // Retorna a mensagem completa
  }

  return result.toDataStreamResponse();
}