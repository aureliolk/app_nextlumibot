import React from 'react';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  isLoading,
  handleInputChange,
  handleSubmit
}) => {
  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder="Como posso ajudar você hoje? Procurando alguma lingerie específica?"
        className="w-full p-4 pr-24 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="absolute right-2 top-2 bottom-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processando...
          </div>
        ) : (
          'Enviar'
        )}
      </button>
    </form>
  );
};

export default ChatInput;