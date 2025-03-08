// app/api/products/route.ts
import { NextResponse } from 'next/server';
import prisma from '../../../lib/db';
import { ProductVariation } from '@/app/products/_services/api';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const includeInactive = url.searchParams.get('active') !== 'true';

    const products = await prisma.product.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { name: 'asc' },
    });

    const formattedProducts = products.map((product: any) => ({
      ...product,
      price: parseFloat(product.price.toString()),
      categories: product.categories as string[],
      variations: product.variations as ProductVariation[],
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const {
      name, url, price, description, brand, gender,
      image, categories, variations, active,
    } = await req.json();

    if (!name || !url || !price) {
      return NextResponse.json({ error: 'Nome, URL e preço são obrigatórios' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        url,
        price,
        description: description || undefined,
        brand: brand || undefined,
        gender: gender || undefined,
        image: image || undefined,
        categories: categories || [],
        variations: variations || [],
        active: active ?? true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
  }
}