// app/products/_services/api.ts
import prisma from '../_lib/db'; // Ajuste o caminho

export interface ProductVariation {
  name: string;
  value: string;
}

// Defina Product para usar Json diretamente, com type assertions para garantir compatibilidade
export interface Product {
  id: number;
  url: string;
  name: string;
  categories: string[]; // Usa string[] para consistência com os dados
  variations: ProductVariation[]; // Usa ProductVariation[] para consistência
  price: number;
  description: string | null;
  brand: string | null;
  gender: string | null;
  image: string | null;
  active: boolean;
  created_at: Date;
}

export interface ProductFormData {
  name: string;
  url: string;
  price: number;
  description?: string;
  brand?: string;
  gender?: string;
  image?: string;
  categories: string[];
  variations: ProductVariation[];
  active?: boolean;
}

export interface ProductService {
  getProducts: (includeInactive?: boolean) => Promise<Product[]>;
  getProduct: (id: number) => Promise<Product>;
  createProduct: (productData: ProductFormData) => Promise<Product>;
  updateProduct: (id: number, productData: Partial<ProductFormData>) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
  toggleProductActive: (id: number, active: boolean) => Promise<Product>;
}

export const ProductService: ProductService = {
  getProducts: async (includeInactive: boolean = false): Promise<Product[]> => {
    try {
      const products = await prisma.product.findMany({
        where: includeInactive ? {} : { active: true },
        orderBy: { name: 'asc' },
      });

      return products.map(product => ({
        ...product,
        price: parseFloat(product.price.toString()),
        categories: (product.categories as string[]) || [], // Assert tipo para string[]
        variations: (product.variations as unknown as ProductVariation[]) || [], // Assert tipo para ProductVariation[]
      }));
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  },

  getProduct: async (id: number): Promise<Product> => {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new Error('Produto não encontrado');
      }

      return {
        ...product,
        price: parseFloat(product.price.toString()),
        categories: (product.categories as string[]) || [],
        variations: (product.variations as unknown as ProductVariation[]) || [],
      };
    } catch (error) {
      console.error(`Erro ao buscar produto ${id}:`, error);
      throw error;
    }
  },

  createProduct: async (productData: ProductFormData): Promise<Product> => {
    try {
      if (!productData.name || !productData.url || !productData.price) {
        throw new Error('Nome, URL e preço são obrigatórios');
      }

      const product = await prisma.product.create({
        data: {
          name: productData.name,
          url: productData.url,
          price: productData.price,
          description: productData.description,
          brand: productData.brand,
          gender: productData.gender,
          image: productData.image,
          categories: productData.categories || [], // Garante array vazio como padrão
          variations: productData.variations || [], // Garante array vazio como padrão
          active: productData.active ?? true,
        },
      });

      return {
        ...product,
        price: parseFloat(product.price.toString()),
        categories: (product.categories as string[]) || [],
        variations: (product.variations as unknown as ProductVariation[]) || [],
      };
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  },

  updateProduct: async (id: number, productData: Partial<ProductFormData>): Promise<Product> => {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new Error('Produto não encontrado');
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          name: productData.name,
          url: productData.url,
          price: productData.price,
          description: productData.description,
          brand: productData.brand,
          gender: productData.gender,
          image: productData.image,
          categories: productData.categories || [],
          variations: productData.variations || [],
          active: productData.active,
        },
      });

      return {
        ...updatedProduct,
        price: parseFloat(updatedProduct.price.toString()),
        categories: (updatedProduct.categories as string[]) || [],
        variations: (updatedProduct.variations as unknown as ProductVariation[]) || [],
      };
    } catch (error) {
      console.error(`Erro ao atualizar produto ${id}:`, error);
      throw error;
    }
  },

  deleteProduct: async (id: number): Promise<void> => {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new Error('Produto não encontrado');
      }

      await prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`Erro ao excluir produto ${id}:`, error);
      throw error;
    }
  },

  toggleProductActive: async (id: number, active: boolean): Promise<Product> => {
    try {
      console.log(`Tentando alterar status do produto ${id} para active=${active}`);
      const product = await prisma.product.findUnique({
        where: { id },
      });
  
      if (!product) {
        console.log(`Produto com ID ${id} não encontrado`);
        throw new Error('Produto não encontrado');
      }
  
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { active },
      });
  
      console.log(`Produto ${id} atualizado com sucesso`);
      return {
        ...updatedProduct,
        price: parseFloat(updatedProduct.price.toString()),
        categories: (updatedProduct.categories as string[]) || [],
        variations: (updatedProduct.variations as unknown as ProductVariation[]) || [],
      };
    } catch (error) {
      console.error(`Erro ao alterar status do produto ${id}:`, error);
      throw error;
    }
  }
};