import { NextResponse } from 'next/server';
import prisma, { normalizeSearchText } from '../../../../lib/db';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const title = url.searchParams.get('title');

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Obter o limite da URL, com padrão de 5 se não especificado
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);

    // Normalizar o título para busca
    const normalizedTitle = normalizeSearchText(title);

    // Busca no Prisma com limite
    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: normalizedTitle,
          mode: 'insensitive', // Case-insensitive
        },
      },
      take: limit, // Limita o número de resultados (padrão = 5)
    });

    // Opcional: Se nenhum resultado for encontrado, tentar busca parcial com limite
    if (products.length === 0) {
      const partialProducts = await prisma.product.findMany({
        where: {
          name: {
            contains: normalizedTitle.slice(0, 3), // Busca pelos primeiros 3 caracteres
            mode: 'insensitive',
          },
        },
        take: limit, // Limita o número de resultados na busca parcial
      });
      return NextResponse.json(partialProducts);
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro na busca de produtos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}