import { NextResponse } from 'next/server';
import prisma, { normalizeSearchText } from '../../../products/_lib/db';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const title = url.searchParams.get('title');

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const normalizedTitle = normalizeSearchText(title);

    // Busca no Prisma com mais flexibilidade
    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: normalizedTitle,
          mode: 'insensitive', // Case-insensitive
        },
      },
    });

    // Opcional: Se nenhum resultado for encontrado, tentar busca parcial ou alternativa
    if (products.length === 0) {
      const partialProducts = await prisma.product.findMany({
        where: {
          name: {
            contains: normalizedTitle.slice(0, 3), // Busca pelos primeiros 3 caracteres
            mode: 'insensitive',
          },
        },
      });
      return NextResponse.json(partialProducts);
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro na busca de produtos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}