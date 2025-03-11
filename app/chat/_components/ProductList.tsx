// app/chat/_components/ProductList.tsx
import React from 'react';
import ProductCard, { Product } from './ProductCard';

interface ProductListProps {
  products: Product[];
  introText?: string;
}

const ProductList: React.FC<ProductListProps> = ({ products, introText }) => {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 mb-4">
      {introText && (
        <p className="text-gray-300 mb-3">{introText}</p>
      )}
      
      <div className="grid grid-cols-1 gap-3">
        {products.map((product, index) => (
          <ProductCard key={`product-${index}`} product={product} />
        ))}
      </div>
      
      <p className="text-sm text-gray-400 mt-3">
        Precisa de mais ajuda para escolher? Estou à disposição! 😊
      </p>
    </div>
  );
};

export default ProductList;