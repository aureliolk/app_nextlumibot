import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai'; // Importar generateText em vez de streamText
import { z } from 'zod';
import prisma from '@/lib/db';
import { normalizeSearchText } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getCurrentPrompt } from '@/app/genprompt/_services/api';

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
    const { message, userId, name } = await req.json();

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
    
    const prompt = await getCurrentPrompt("9");
    console.log(prompt?.prompt_complete);

    // Usar generateText em vez de streamText
    const result = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'system',
          content: ` Contexto:
          - Intenção Detectada: ${intent}
          - ID do Cliente: ${conversationId}
          - Nome do Cliente: ${name}
          
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
          ${prompt?.prompt_complete}
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
              const products: any = await prisma.product.findMany({
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
    try {
      const jsonData = JSON.parse(result.text);
      return NextResponse.json(jsonData);
    } catch (e) {
      // Se não for JSON válido, formatar a resposta
      return NextResponse.json({
        message: result.text,
        products: [] // Array vazio quando não há produtos
      });
    }

  } catch (error: any) {
    console.error('Erro na API:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
}