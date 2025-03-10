import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// Permitir respostas streaming por até 30 segundos
export const maxDuration = 30;

// Função para identificar a intenção da mensagem
function identifyIntent(message: string): string {
  const lowercaseMessage = message.toLowerCase();
  
  const intents = [
    { keywords: ['calcinha', 'calcinhas'], intent: 'buscar_calcinha' },
    { keywords: ['sutiã', 'sutiãs', 'sutia', 'sutias'], intent: 'buscar_sutia' },
    { keywords: ['tamanho', 'medida'], intent: 'duvida_tamanho' },
    { keywords: ['preço', 'valor', 'custo'], intent: 'consulta_preco' },
    { keywords: ['cor', 'cores'], intent: 'buscar_cor' },
    { keywords: ['marca'], intent: 'buscar_marca' }
  ];

  for (const intentConfig of intents) {
    if (intentConfig.keywords.some(keyword => lowercaseMessage.includes(keyword))) {
      return intentConfig.intent;
    }
  }
  
  return 'consulta_geral';
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  // Identificar a intenção da mensagem
  const intent = identifyIntent(lastMessage);

  const result = streamText({
    model: openai('gpt-4o'),
    messages: [
      {
        role: 'system',
        content: `Você é um assistente de vendas especializado para uma loja de lingerie Duhellen.
        
        Diretrizes de Atendimento:
        - Seja empático e atencioso
        - Foque em entender a real necessidade do cliente
        - Use linguagem amigável e próxima
        - Ofereça soluções personalizadas
        
        FORMATO DE RESPOSTA:
        Quando mencionar produtos, você DEVE fornecer suas respostas no formato JSON estruturado. Sua resposta deve estar no seguinte formato:

        \`\`\`json
        {
          "message": "Mensagem introdutória ou resposta textual",
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

        Se não estiver mencionando produtos específicos, use apenas o campo "message" e não inclua o campo "products".
        Nunca inclua os links ou imagens diretamente no texto da mensagem.
        Se estiver apresentando produtos, coloque apenas uma mensagem introdutória curta no campo "message".
        
        Contexto da Última Interação:
        - Intenção Detectada: ${intent}
        - Última Mensagem: ${lastMessage}
        
        Instruções Específicas:
        - Se for busca de produto, utilize a ferramenta de busca
        - Adapte a resposta conforme a intenção identificada
        - Mantenha o tom amigável e consultivo
        - Certifique-se de que sua resposta seja JSON válido dentro dos blocos de código
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
            const { default: prisma } = await import('./_lib/db');
            const { normalizeSearchText } = await import('./_lib/db');

            const normalizedQuery = normalizeSearchText(query);

            // Removemos a busca nas categorias/JSON por enquanto para evitar o erro
            const products = await prisma.product.findMany({
              where: {
                OR: [
                  { name: { contains: normalizedQuery, mode: 'insensitive' } },
                  { description: { contains: normalizedQuery, mode: 'insensitive' } },
                  // Removida a busca em categorias que estava causando erro:
                  // { categories: { path: '$.name' as any, array_contains: normalizedQuery } }
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

            // Formatar os produtos com apenas os campos necessários
            const formattedProducts = products.map(product => ({
              id: product.id,
              name: product.name,
              price: parseFloat(product.price.toString()).toFixed(2),
              image: product.image,
              url: `https://duhellen.com.br/produtos/${product.url}`
            }));

            console.log(`Encontrados ${formattedProducts.length} produtos para a consulta "${query}"`);

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

  return result.toDataStreamResponse();
}