import { NextResponse } from 'next/server';
import prisma from '../../../../lib/db'; // Importa o cliente Prisma

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop(); // Extrai o ID da URL

    if (!id) {
      return NextResponse.json({ error: 'ID do produto não fornecido' }, { status: 400 });
    }

    const body = await req.json();
    const { active } = body;

    if (active === undefined) {
      return NextResponse.json({ error: 'O campo "active" é obrigatório' }, { status: 400 });
    }

    // Verifica se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: Number(id) }, // Converte o ID para número
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Atualiza o campo active do produto
    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: { active },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error(`Erro ao alterar status do produto:`, error);
    return NextResponse.json({ error: 'Erro ao alterar status do produto' }, { status: 500 });
  }
}