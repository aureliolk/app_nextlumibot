import React, { useState, useEffect } from 'react';
import { Product, ProductFormData, ProductVariation } from '../_services/api';

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    url: '',
    price: 0,
    description: '',
    brand: '',
    gender: '',
    image: '',
    categories: [''],
    variations: [{ name: 'Cor', value: '' }],
    active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Preencher o formulário com dados do produto se estiver editando
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        url: product.url,
        price: product.price,
        description: product.description || '',
        brand: product.brand || '',
        gender: product.gender || '',
        image: product.image || '',
        categories: product.categories.length ? product.categories : [''],
        variations: product.variations.length ? product.variations : [{ name: 'Cor', value: '' }],
        active: product.active !== undefined ? product.active : true
      });
    }
  }, [product]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome do produto é obrigatório';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'URL do produto é obrigatório';
    }
    
    if (formData.price <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
    }
    
    if (!formData.brand.trim()) {
      newErrors.brand = 'Marca é obrigatória';
    }
    
    if (!formData.image.trim()) {
      newErrors.image = 'URL da imagem é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Erro ao enviar formulário:', error);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      price: value
    }));
  };

  const handleCategoryChange = (index: number, value: string) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[index] = value;
    setFormData(prev => ({
      ...prev,
      categories: updatedCategories
    }));
  };

  const addCategory = () => {
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, '']
    }));
  };

  const removeCategory = (index: number) => {
    if (formData.categories.length > 1) {
      const updatedCategories = [...formData.categories];
      updatedCategories.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        categories: updatedCategories
      }));
    }
  };

  const handleVariationChange = (index: number, field: keyof ProductVariation, value: string) => {
    const updatedVariations = [...formData.variations];
    updatedVariations[index] = {
      ...updatedVariations[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      variations: updatedVariations
    }));
  };

  const addVariation = () => {
    setFormData(prev => ({
      ...prev,
      variations: [...prev.variations, { name: 'Cor', value: '' }]
    }));
  };

  const removeVariation = (index: number) => {
    if (formData.variations.length > 1) {
      const updatedVariations = [...formData.variations];
      updatedVariations.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        variations: updatedVariations
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-6">{product ? 'Editar Produto' : 'Adicionar Novo Produto'}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Nome do produto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Produto*
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        
        {/* URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL*
          </label>
          <input
            type="text"
            name="url"
            value={formData.url}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${errors.url ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Preço */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preço (R$)*
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handlePriceChange}
            min="0"
            step="0.01"
            className={`w-full p-2 border rounded ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
        </div>
        
        {/* Marca */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marca*
          </label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${errors.brand ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
        </div>
        
        {/* Gênero */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gênero
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Selecione</option>
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
            <option value="Unissex">Unissex</option>
            <option value="Infantil">Infantil</option>
          </select>
        </div>
      </div>
      
      {/* Imagem */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL da Imagem*
        </label>
        <input
          type="text"
          name="image"
          value={formData.image}
          onChange={handleChange}
          className={`w-full p-2 border rounded ${errors.image ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="https://exemplo.com/imagem.jpg"
        />
        {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
        
        {formData.image && (
          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-1">Pré-visualização:</p>
            <img 
              src={formData.image ? (formData.image.startsWith('http') ? formData.image : `https://duhellen.com.br${formData.image}`) : 'https://via.placeholder.com/150?text=Sem+Imagem'} 
              alt="Pré-visualização" 
              className="w-32 h-32 object-cover border border-gray-300 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Imagem+Inválida';
              }}
            />
          </div>
        )}
      </div>
      
      {/* Descrição */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>
      
      {/* Categorias */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categorias
        </label>
        
        {formData.categories.map((category, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="text"
              value={category}
              onChange={(e) => handleCategoryChange(index, e.target.value)}
              className="flex-grow p-2 border border-gray-300 rounded"
              placeholder="Ex: Sutiãs > Básicos"
            />
            
            <button
              type="button"
              onClick={() => removeCategory(index)}
              className="ml-2 p-2 text-red-500 hover:text-red-700"
              disabled={formData.categories.length <= 1}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addCategory}
          className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Adicionar Categoria
        </button>
      </div>
      
      {/* Variações */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Variações
        </label>
        
        {formData.variations.map((variation, index) => (
          <div key={index} className="flex items-center mb-2 gap-2">
            <select
              value={variation.name}
              onChange={(e) => handleVariationChange(index, 'name', e.target.value)}
              className="p-2 border border-gray-300 rounded w-1/3"
            >
              <option value="Cor">Cor</option>
              <option value="Tamanho">Tamanho</option>
              <option value="Largura do Tórax">Largura do Tórax</option>
            </select>
            
            <input
              type="text"
              value={variation.value}
              onChange={(e) => handleVariationChange(index, 'value', e.target.value)}
              className="flex-grow p-2 border border-gray-300 rounded"
              placeholder="Valor da variação"
            />
            
            <button
              type="button"
              onClick={() => removeVariation(index)}
              className="p-2 text-red-500 hover:text-red-700"
              disabled={formData.variations.length <= 1}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addVariation}
          className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Adicionar Variação
        </button>
      </div>
      
      {/* Switch de Ativo/Inativo */}
      <div className="mb-6">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
            />
            <div className={`block w-14 h-8 rounded-full ${formData.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${formData.active ? 'translate-x-6' : ''}`}></div>
          </div>
          <div className="ml-3 text-gray-700 font-medium">
            {formData.active ? 'Produto Ativo' : 'Produto Inativo'}
          </div>
        </label>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : (product ? 'Atualizar Produto' : 'Adicionar Produto')}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
