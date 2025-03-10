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
        
        Regras para Apresentação de Produtos:
        1. Apresente produtos de forma clara e objetiva
        2. Destaque características principais
        3. Indique disponibilidade e variações
        4. Forneça links para mais detalhes
        5. Sugira complementos ou combinações
        
        Contexto da Última Interação:
        - Intenção Detectada: ${intent}
        - Última Mensagem: ${lastMessage}
        
        Instruções Específicas:
        - Se for busca de produto, utilize a ferramenta de busca
        - Adapte a resposta conforme a intenção identificada
        - Mantenha o tom amigável e consultivo
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
            const { default: prisma } = await import('@/lib/db');
            const { normalizeSearchText } = await import('@/lib/db');

            const normalizedQuery = normalizeSearchText(query);

            const products = await prisma.product.findMany({
              where: {
                OR: [
                  { name: { contains: normalizedQuery, mode: 'insensitive' } },
                  { description: { contains: normalizedQuery, mode: 'insensitive' } },
                  // Modificação para lidar com categorias de forma mais flexível
                  { 
                    categories: {
                      // Converte para string para comparação
                      string_contains: normalizedQuery 
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
                brand: true,
                gender: true,
                image: true,
                variations: true, // Este campo será tratado como any para maior flexibilidade
                categories: true,
              } as const
            });

            // Definir uma interface para variações
            interface ProductVariation {
              name?: string;
              value?: string;
            }

            // Formatar os produtos para uma estrutura mais limpa e legível
            const formattedProducts = products.map(product => {
              // Gerar URL de imagem placeholder se não houver imagem
              const imageUrl = product.image 
                ? (product.image.startsWith('http') 
                  ? product.image 
                  : `https://duhellen.com.br${product.image}`)
                : `https://via.placeholder.com/300x400?text=${encodeURIComponent(product.name)}`;

              // Garantir que variations seja um array de variações
              const variations = (Array.isArray(product.variations) 
                ? product.variations 
                : []) as ProductVariation[];

              // Determinar variações de tamanho
              const sizeVariation = variations.find(
                (v): v is ProductVariation => 
                  typeof v === 'object' && 
                  v !== null && 
                  v.name?.toLowerCase() === 'tamanho'
              )?.value || 'P';

              return {
                id: product.id,
                name: product.name,
                price: `R$ ${parseFloat(product.price.toString()).toFixed(2)}`,
                brand: product.brand || 'Duhellen',
                url: product.url,
                image: imageUrl,
                size: sizeVariation,
                color: variations.find(
                  (v): v is ProductVariation => 
                    typeof v === 'object' && 
                    v !== null && 
                    v.name?.toLowerCase() === 'cor'
                )?.value || 'Não especificada',
                details: `[Ver mais detalhes](${product.url})`
              };
            });

            // Criar uma mensagem formatada em Markdown
            const productsMessage = formattedProducts.map((product, index) => 
              `${index + 1}. **${product.name}** - ${product.price} - Cor: ${product.color} - Tamanho: ${product.size} - ${product.details} - ![Imagem](${product.image})`
            ).join('\n\n');

            return { 
              products: formattedProducts, 
              message: formattedProducts.length > 0 
                ? `Encontrei algumas opções de calcinhas que podem te interessar:\n\n${productsMessage}\n\nSe precisar de mais informações ou ajuda para escolher, estou aqui para ajudar! 😊`
                : 'Nenhum produto encontrado para esta busca.'
            };
          } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            return { 
              error: 'Erro ao buscar produtos', 
              products: [],
              message: 'Desculpe, não foi possível realizar a busca no momento.'
            };
          }
        },
      }),

      // Ferramenta para obter detalhes específicos de produtos
      getProductDetails: tool({
        description: 'Obter detalhes completos de um produto específico pelo ID',
        parameters: z.object({
          productId: z.number().describe('ID do produto'),
        }),
        execute: async ({ productId }) => {
          try {
            const { default: prisma } = await import('@/lib/db');

            const product = await prisma.product.findUnique({
              where: {
                id: productId,
                active: true,
              },
            });

            if (!product) {
              return { 
                error: 'Produto não encontrado', 
                product: null,
                message: 'Desculpe, não encontrei detalhes para este produto.'
              };
            }

            return { 
              product,
              message: `Detalhes do produto ${product.name} encontrados com sucesso.`
            };
          } catch (error) {
            console.error('Erro ao buscar detalhes do produto:', error);
            return { 
              error: 'Erro ao buscar detalhes do produto', 
              product: null,
              message: 'Não foi possível recuperar os detalhes do produto.'
            };
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}