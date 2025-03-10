import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// Permitir respostas streaming por até 30 segundos
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Definir ferramentas para buscar produtos
  const result = streamText({
    model: openai('gpt-4o'),
    messages:[
      {
        role: 'system',
        content: `Você é um assistente de vendas especializado.
        
        Quando apresentar produtos, siga estas regras:
        
        1. Apresente cada produto em um formato estruturado e claro
        2. Use marcadores numéricos para listar produtos (1., 2., 3.)
        3. Para cada produto, apresente as informações na seguinte ordem:
           - Nome do produto
           - Preço (formatado como R$ XX,XX)
           - Marca
           - Principais características (como cor, tamanho, etc.)
        4. Use linguagem simples e direta
        5. Evite textos muito longos ou informações redundantes
        6. Sempre inclua uma opção para ver mais detalhes
        7. Limite a descrição de cada produto a no máximo 2 linhas
        
        Exemplo de formato desejado:
        
        1. **Calcinha String Fio-Duplo Brise** - R$ 69,00
           Marca: Duhellen | Cor: Preto | Tamanho: P
           [Ver mais detalhes](link)
        
        2. **Sutiã Tomara Que Caia** - R$ 89,00
           Marca: Duhellen | Cor: Branco | Tamanho: M
           [Ver mais detalhes](link)
        `
      }
    ],
    tools: {
      // Em app/api/chat/route.ts - ferramenta de busca de produtos
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
                  { description: { contains: normalizedQuery, mode: 'insensitive' } }
                ],
                active: true,
              },
              take: limit,
              // Garantir que retornamos todos os campos necessários
              select: {
                id: true,
                name: true,
                url: true,
                price: true,
                brand: true,
                gender: true,
                image: true,
                variations: true,
              }
            });

            // Formatar os produtos para uma estrutura mais limpa
            const formattedProducts = products.map(product => ({
              id: product.id,
              name: product.name,
              price: parseFloat(product.price.toString()),
              brand: product.brand,
              url: product.url,
              image: product.image,
              variations: product.variations
            }));

            return { products: formattedProducts };
          } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            return { error: 'Erro ao buscar produtos', products: [] };
          }
        },
      }),

      getProductDetails: tool({
        description: 'Obter detalhes de um produto específico pelo ID',
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
              return { error: 'Produto não encontrado', product: null };
            }

            return { product };
          } catch (error) {
            console.error('Erro ao buscar detalhes do produto:', error);
            return { error: 'Erro ao buscar detalhes do produto', product: null };
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}