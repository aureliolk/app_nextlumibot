// app/follow-up/_components/SearchBar.tsx
'use client';

import React from 'react';

interface SearchBarProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  showNewForm: boolean;
  onToggleForm: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, 
  onSearch, 
  showNewForm, 
  onToggleForm 
}) => {
  return (
    <div className="flex space-x-2">
      <input
        type="text"
        placeholder="Buscar cliente..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        className="px-3 py-1 bg-gray-700 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
      <button
        onClick={onToggleForm}
        className="px-3 py-1 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 transition-colors"
      >
        {showNewForm ? 'Cancelar' : 'Novo Follow-up'}
      </button>
    </div>
  );
};