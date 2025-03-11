// app/chat/_components/ProductCard.tsx
import React from 'react';

export interface Product {
  name: string;
  price: string;
  color: string;
  size: string;
  image: string;
  detailsUrl: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="flex flex-col sm:flex-row bg-gray-700 rounded-lg overflow-hidden transition-all hover:bg-gray-650 border border-gray-600 hover:border-orange-500">
      {/* Imagem do produto */}
      <div className="w-full sm:w-24 h-32 sm:h-auto bg-gray-800 relative">
        <img
          src="https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081"
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/150?text=Duhellen';
          }}
        />
      </div>
      
      {/* Informações do produto */}
      <div className="flex-grow p-3 flex flex-col">
        <h3 className="text-sm font-medium text-white">{product.name}</h3>
        <div className="mt-2 flex flex-col">
          <span className="text-orange-400 font-bold text-lg">R$ {product.price}</span>
          <div className="text-xs text-gray-300 mt-1 flex flex-wrap gap-2">
            {product.color && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-600">
                Cor: {product.color}
              </span>
            )}
            {product.size && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-600">
                Tamanho: {product.size}
              </span>
            )}
          </div>
        </div>
        
        {/* Botão de detalhes */}
        <div className="mt-auto pt-2 flex justify-end">
          <a 
            href={product.detailsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs bg-orange-600 hover:bg-orange-700 text-white py-1 px-3 rounded transition-colors"
          >
            Ver detalhes
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;