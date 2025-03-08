import { RefObject, useState } from 'react'

interface AudioUploaderProps {
  fileInputRef: RefObject<HTMLInputElement>
  audioFile: File | null
  isLoading: boolean
  isConverting?: boolean
  conversionProgress?: string
  onFileChange: (file: File | null) => void
  onUpload: (file: File) => Promise<void>
  onCancel: () => void
}

const AudioUploader = ({
  fileInputRef,
  audioFile,
  isLoading,
  isConverting = false,
  conversionProgress = '',
  onFileChange,
  onUpload,
  onCancel
}: AudioUploaderProps) => {
  
  // Função para lidar com o upload de arquivo de áudio
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]

      // Lista de extensões válidas de áudio
      const validExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.ogg', '.oga', '.flac']
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

      // Verifica se é um arquivo de áudio pelo MIME type ou pela extensão
      if (file.type.startsWith('audio/') || validExtensions.some(ext => fileExtension === ext)) {
        console.log(`Arquivo de áudio selecionado: ${file.name} (${file.size} bytes, tipo: ${file.type})`)
        onFileChange(file)
      } else {
        console.error(`Arquivo inválido selecionado: ${file.name} (${file.type})`)
        onFileChange(null)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Input oculto para seleção de arquivo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAudioFileChange}
        accept="audio/mp3,audio/mpeg,audio/mp4,audio/ogg,audio/webm,audio/wav,audio/*"
        className="hidden"
      />

      {audioFile && (
        <div className="flex gap-2">
          <div className="flex-grow flex items-center justify-start py-3 px-4 rounded-lg text-white bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <div className="flex flex-col truncate">
              <span className="truncate font-medium">{audioFile?.name}</span>
              <span className="text-xs text-gray-400">
                {(audioFile.size / 1024).toFixed(1)} KB • {audioFile.type.replace('audio/', '')}
              </span>
              {isConverting && (
                <span className="text-xs text-orange-300 animate-pulse mt-1">
                  {conversionProgress}
                </span>
              )}
            </div>
          </div>

          {/* Botão para enviar áudio */}
          <button
            type="button"
            onClick={() => onUpload(audioFile)}
            disabled={isLoading || isConverting}
            className="flex items-center justify-center py-3 px-4 rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Enviar áudio"
          >
            {isConverting ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>

          {/* Botão para deletar áudio */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center justify-center py-3 px-4 rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Deletar áudio"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default AudioUploader