// app/products/page.tsx
import { Product, ProductService } from './_services/api';
import ProductList from './_components/ProductList';

export default async function ProductsPage() {
  let products: Product[] = [];
  let error = '';

  try {
    products = await ProductService.getProducts(true); // true para incluir produtos inativos
    console.log('Total de produtos recebidos do servidor:', products.length);
    console.log('Primeiro produto:', products[0]);
  } catch (err) {
    error = 'Erro ao carregar produtos. Por favor, tente novamente.';
    console.error('Erro ao carregar produtos:', err);
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <ProductList products={products} />
  );
}