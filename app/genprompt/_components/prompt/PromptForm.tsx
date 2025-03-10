import { useState, FormEvent } from 'react'

interface PromptFormProps {
  prompt: string
  setPrompt: (prompt: string) => void
  onSubmit: (text: string) => Promise<void>
  isLoading: boolean
  onStartRecording: () => void
  onStartUpload: () => void
}

const PromptForm = ({
  prompt,
  setPrompt,
  onSubmit,
  isLoading,
  onStartRecording,
  onStartUpload
}: PromptFormProps) => {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await onSubmit(prompt)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="prompt" className="text-sm font-medium text-gray-300 block mb-2">
          Escreva sua Instrução:
        </label>
        <textarea
          id="prompt"
          name="prompt"
          rows={4}
          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-light text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          placeholder="Escreva a instrução do comportamento que o agente deve executar..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        {/* Botão de envio de texto */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-grow flex justify-center py-3 px-4 rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Add a Instrução...</span>
            </span>
          ) : (
            'Enviar Instrução'
          )}
        </button>

        {/* Botão para gravação de áudio */}
        <button
          type="button"
          onClick={onStartRecording}
          disabled={isLoading}
          className="flex items-center justify-center py-3 px-4 rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Gravar áudio"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        {/* Botão para upload manual de áudio */}
        {/* <button
          type="button"
          onClick={onStartUpload}
          disabled={isLoading}
          className="flex items-center justify-center py-3 px-4 rounded-lg text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Carregar arquivo de áudio"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </button> */}
      </div>
    </form>
  )
}

export default PromptForm