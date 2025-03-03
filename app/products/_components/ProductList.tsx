// app/products/_components/ProductList.tsx
'use client';

import { useState, useTransition } from 'react';
import ProductForm from './ProductForm'; // Ajuste o caminho conforme necessário

// Interface Product (mova isso para um arquivo separado se preferir)
interface Product {
  id: number;
  url: string;
  name: string;
  categories: string[];
  variations: { name: string; value: string }[];
  price: number;
  description: string | null;
  brand: string | null;
  gender: string | null;
  image: string | null;
  active: boolean;
  created_at: Date;
}

// Interface ProductFormData (mova isso para um arquivo separado se preferir)
interface ProductFormData {
  name: string;
  url: string;
  price: number;
  description?: string;
  brand?: string;
  gender?: string;
  image?: string;
  categories: string[];
  variations: { name: string; value: string }[];
  active?: boolean;
}

interface ProductListProps {
  products: Product[];
}

export default function ProductList({ products }: ProductListProps) {
  const [productList, setProductList] = useState<Product[]>(products);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao excluir produto');
        }

        startTransition(() => {
          setProductList(productList.filter(p => p.id !== id));
        });
        alert('Produto excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto. Tente novamente.');
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !product.active }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao alterar status do produto');
      }

      const updatedProduct: Product = await response.json();
      startTransition(() => {
        setProductList(productList.map(p => (p.id === product.id ? updatedProduct : p)));
      });
    } catch (error) {
      console.error('Erro ao alterar status do produto:', error);
      alert('Erro ao alterar status do produto. Tente novamente.');
    }
  };

  const handleSaveProduct = async (data: ProductFormData) => {
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar produto');
      }

      const savedProduct: Product = await response.json();
      startTransition(() => {
        if (editingProduct) {
          setProductList(productList.map(p => (p.id === editingProduct.id ? savedProduct : p)));
        } else {
          setProductList([...productList, savedProduct]);
        }
      });

      alert(editingProduct ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!');
      setShowAddForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto. Tente novamente.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciar Produtos</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowAddForm(!showAddForm);
          }}
          className={`px-4 py-2 rounded ${showAddForm ? 'bg-gray-500 text-white' : 'bg-blue-600 text-white'}`}
          disabled={isPending}
        >
          {showAddForm ? 'Cancelar' : 'Adicionar Produto'}
        </button>
      </div>

      {showAddForm && (
        <ProductForm
          product={editingProduct || undefined}
          onSubmit={handleSaveProduct}
          onCancel={() => {
            setShowAddForm(false);
            setEditingProduct(null);
          }}
          isSubmitting={isPending}
        />
      )}

      <div className="bg-white rounded-lg shadow-md overflow-x-auto max-w-full">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Imagem</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-xs">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Marca</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Preço</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productList.length > 0 ? (
              productList.map(product => (
                <tr key={product.id}>
                  <td className="px-6 py-4 text-sm text-gray-500 w-16">{product.id}</td>
                  <td className="px-6 py-4 w-20">
                    <div className="h-10 w-10 overflow-hidden rounded-full flex items-center justify-center bg-gray-100">
                      <img 
                        src={product.image ? (product.image.startsWith('http') ? product.image : `https://duhellen.com.br${product.image}`) : 'https://via.placeholder.com/40?text=Sem+Imagem'} 
                        alt={product.name} 
                        className="h-10 w-10 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Sem+Imagem';
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs">
                    <div className="truncate" title={product.name}>{product.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 w-32">
                    <div className="truncate" title={product.brand as string}>{product.brand}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 w-24">
                    <div className="truncate">R$ {typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 w-24">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {product.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium w-32">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-indigo-600 hover:text-indigo-900 text-left"
                        disabled={isPending}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`${product.active ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'} text-left`}
                        disabled={isPending}
                      >
                        {product.active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900 text-left"
                        disabled={isPending}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nenhum produto encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}