'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import PromptForm from '../_components/prompt/PromptForm'
import AudioRecorder from '../_components/prompt/AudioRecorder'
import AudioUploader from '../_components/prompt/AudioUploader'
import ResponseDisplay from '../_components/prompt/ResponseDisplay'
import PromptHistory from '../_components/prompt/PromptHistory'
import { convertWebmToMp3 } from '../_utils/audioUtils'

// Interface para os prompts
interface PromptHistory {
  id: string;
  account_id: string;
  prompt: string;
  created_at: string;
  analysis?: string;
  prompt_created?: string;
  prompt_removed?: string;
  prompt_complete?: string;
  quality_checks?: string[];
}

function GenPrompt() {
  const promptParam = useParams<{ id: any; }>()
  
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [audioFile, setAudioFile] = useState<File | null | any>(null)
  const [isAudioMode, setIsAudioMode] = useState(false)
  const [promptHistory, setPromptHistory] = useState<PromptHistory[]>([])
  const [showPromptHistory, setShowPromptHistory] = useState(false)
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null)
  const [isSettingCurrent, setIsSettingCurrent] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carregar dados iniciais
  useEffect(() => {
    if (promptParam && promptParam.id.length > 0) {
      fetchPromptData()
    }
  }, [promptParam])

  // Buscar dados do prompt e histórico
  const fetchPromptData = async () => {
    try {
      // Buscar o histórico de prompts
      const historyResponse = await fetch(`/api/prompts?accountId=${promptParam.id}`)

      if (historyResponse.ok) {
        const promptsData = await historyResponse.json()
        console.log(promptsData)
        setPromptHistory(promptsData)
      } else {
        console.error('Erro ao buscar dados dos prompts:', await historyResponse.text())
      }

      // Buscar o prompt atual
      const currentPromptResponse = await fetch(`/api/prompts/current?accountId=${promptParam.id}`)

      if (currentPromptResponse.ok) {
        const currentPromptData = await currentPromptResponse.json()
        setCurrentPromptId(currentPromptData.id)
        setResponse(currentPromptData.prompt_complete || currentPromptData.prompt)
      } else if (currentPromptResponse.status !== 404) {
        // Ignora 404 (não encontrado) porque é um caso válido
        console.error('Erro ao buscar prompt atual:', await currentPromptResponse.text())
      }
    } catch (error) {
      console.error('Erro ao buscar dados dos prompts:', error)
    }
  }

  // Enviar texto do prompt
  const handleSubmit = async (text: string) => {
    if (!text.trim()) {
      setError('Escreva uma instrução')
      return
    }

    try {
      setIsLoading(true)
      setResponse('')

      // Primeiro obtemos a resposta da API externa
      const externalResponse = await fetch('https://webhookn8n.lumibot.com.br/webhook/create/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          promptParam: promptParam.id,
          inputType: 'text'
        })
      })

      if (!externalResponse.ok) {
        throw new Error(`HTTP error! status: ${externalResponse.status}`)
      }

      const apiResponseText = await externalResponse.json()
      setResponse(apiResponseText)

      // Salvar o prompt no banco de dados
      await savePromptToDatabase(text, apiResponseText)
      
      // Atualizar o histórico
      await fetchPromptData()
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to get response from server')
    } finally {
      setIsLoading(false)
    }
  }

  // Salvar prompt no banco de dados
  const savePromptToDatabase = async (text: string, apiResponse: string) => {
    try {
      const saveResponse = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          promptParam: promptParam.id,
          apiResponse: apiResponse
        })
      })

      if (!saveResponse.ok) {
        console.error('Erro ao salvar prompt no banco de dados:', await saveResponse.text())
      } else {
        console.log('Prompt salvo com sucesso no banco de dados')
      }
    } catch (error) {
      console.error('Erro ao salvar prompt:', error)
    }
  }

  // Enviar arquivo de áudio
  const handleAudioUpload = async (file: File) => {
    if (!file) {
      setError('Arquivo de áudio inválido')
      return
    }

    try {
      setIsLoading(true)
      setResponse('')

      // Converter qualquer formato de áudio para mp3
      let finalFile = file;
      
      // Verificar se o arquivo já é MP3
      if (!file.type.includes('mp3') && !file.type.includes('mpeg')) {
        try {
          const fileBlob = file.slice(0, file.size, file.type);
          const mp3Blob = await convertWebmToMp3(fileBlob);
          
          const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
          const fileName = `${fileNameWithoutExt}.mp3`;
          
          finalFile = new File([mp3Blob], fileName, {
            type: 'audio/mpeg',
            lastModified: new Date().getTime()
          });
        } catch (conversionError) {
          console.error('Erro na conversão do áudio:', conversionError);
        }
      }

      // Criar FormData para enviar o arquivo
      const formData = new FormData()
      formData.append('audio', finalFile)
      formData.append('inputType', 'audio')
      
      if (promptParam) {
        formData.append('account_id', promptParam.id)
      }

      const response = await fetch('https://webhookn8n.lumibot.com.br/webhook/create/prompt', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data || !data[0] || !data[0].text) {
        throw new Error('Formato de resposta inválido da API de áudio')
      }

      const apiResponseText = data[0].text
        .replace(/\\n/g, '\n')
        .replace(/\\\"/g, '"')
        .replace(/\\/g, '')
        .replace(/\n\n+/g, '\n\n')
        .trim()

      setResponse(apiResponseText)

      // Salvar o prompt no banco de dados
      await savePromptToDatabase(`Áudio: ${finalFile.name}`, apiResponseText)
      
      // Atualizar o histórico
      await fetchPromptData()

      // Limpar o arquivo após envio bem-sucedido
      setAudioFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Voltar para o estado inicial da interface
      setIsAudioMode(false)
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Falha ao enviar arquivo de áudio')
    } finally {
      setIsLoading(false)
    }
  }

  // Restaurar um prompt do histórico
  const restorePrompt = async (promptId: string) => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/prompts/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promptId })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setResponse(data.prompt)
      } else {
        throw new Error('Falha ao restaurar o prompt')
      }
    } catch (error) {
      console.error('Erro ao restaurar prompt:', error)
      setError(error instanceof Error ? error.message : 'Falha ao restaurar o prompt')
    } finally {
      setIsLoading(false)
    }
  }

  // Definir um prompt como atual
  const setPromptAsCurrent = async (promptId: string) => {
    try {
      setIsSettingCurrent(true)

      const response = await fetch('/api/prompts/current', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: promptParam.id,
          promptId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setCurrentPromptId(promptId)
        setResponse(data.prompt.prompt_complete || data.prompt.prompt)
      } else {
        throw new Error('Falha ao definir o prompt atual')
      }
    } catch (error) {
      console.error('Erro ao definir prompt atual:', error)
      setError(error instanceof Error ? error.message : 'Falha ao definir o prompt atual')
    } finally {
      setIsSettingCurrent(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 py-6 flex flex-col justify-center sm:py-12">
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-semibold text-center mb-8 text-white">
              Gerador de Instrução
            </h1>

            {/* Área de entrada: escolha entre texto ou áudio */}
            {!isAudioMode ? (
              <PromptForm 
                prompt={prompt}
                setPrompt={setPrompt}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                onStartRecording={() => setIsAudioMode(true)}
                onStartUpload={() => {
                  setIsAudioMode(true)
                  if (fileInputRef.current) {
                    fileInputRef.current.click()
                  }
                }}
              />
            ) : (
              <>
                <AudioRecorder 
                  onAudioRecorded={setAudioFile}
                  onCancel={() => setIsAudioMode(false)}
                />
                <AudioUploader
                  fileInputRef={fileInputRef}
                  audioFile={audioFile}
                  isLoading={isLoading}
                  onFileChange={setAudioFile}
                  onUpload={handleAudioUpload}
                  onCancel={() => {
                    setAudioFile(null)
                    setIsAudioMode(false)
                  }}
                />
              </>
            )}
            
            {error && (
              <div className="text-red-400 text-sm py-2 px-3 bg-red-900/50 rounded-md mt-2">
                {error}
              </div>
            )}

            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-medium text-gray-300">Instrução Gerada:</h2>
                <button
                  type="button"
                  onClick={() => setShowPromptHistory(!showPromptHistory)}
                  className="text-xs px-3 py-1 rounded-md bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                >
                  {showPromptHistory ? 'Esconder Histórico' : 'Mostrar Histórico'}
                </button>
              </div>

              {/* Histórico de prompts */}
              {showPromptHistory && (
                <PromptHistory
                  prompts={promptHistory}
                  currentPromptId={currentPromptId}
                  isSettingCurrent={isSettingCurrent}
                  onRestore={restorePrompt}
                  onSetCurrent={setPromptAsCurrent}
                />
              )}

              {/* Área de resposta */}
              <ResponseDisplay
                response={response}
                isLoading={isLoading}
              />
            </div>
            
            <div className='mt-8 text-xs text-center text-white'>
              &copy; <a href="https://lumibot.com.br" target="_blank" rel="noopener noreferrer">Lumibot</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GenPrompt