import { NextResponse } from 'next/server';
import prisma from '../../../../lib/db'; // Ajustei para importar o cliente Prisma

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Busca o produto pelo ID usando Prisma
    const product = await prisma.product.findUnique({
      where: { id: Number(id) }, // Converte id para número, já que no Prisma o ID geralmente é numérico
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Ajusta o preço para formato numérico, se necessário
    const formattedProduct = {
      ...product,
      price: parseFloat(product.price.toString()), // Garante que o preço seja um número
    };

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error(`Erro ao buscar produto:`, error);
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const {
      name, url, price, description, brand, gender,
      image, categories, variations, active,
    } = body;

    // Verifica se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Atualiza o produto com os dados fornecidos
    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name,
        url,
        price: price !== undefined ? Number(price) : existingProduct.price, // Converte para número
        description: description !== undefined ? description : existingProduct.description,
        brand: brand !== undefined ? brand : existingProduct.brand,
        gender: gender !== undefined ? gender : existingProduct.gender,
        image: image !== undefined ? image : existingProduct.image,
        categories: categories !== undefined ? categories : existingProduct.categories,
        variations: variations !== undefined ? variations : existingProduct.variations,
        active: active !== undefined ? active : existingProduct.active,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error(`Erro ao atualizar produto ${params.id}:`, error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Verifica se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Deleta o produto
    await prisma.product.delete({
      where: { id: Number(id) },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Erro ao excluir produto ${params.id}:`, error);
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { active } = body;

    if (active === undefined) {
      return NextResponse.json({ error: 'O campo "active" é obrigatório' }, { status: 400 });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: { active },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error(`Erro ao alterar status do produto ${params.id}:`, error);
    return NextResponse.json({ error: 'Erro ao alterar status do produto' }, { status: 500 });
  }
}