'use client'

import { useState, FormEvent, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { ComponentPropsWithoutRef } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'

// Declaração para o conversor de áudio WebM para MP3
declare global {
  interface Window {
    lamejs?: any;
  }
}

// Função para converter o áudio WebM para MP3
const convertWebmToMp3 = async (webmBlob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Criar URL para o blob
      const audioURL = URL.createObjectURL(webmBlob);
      
      // Criar elemento de áudio
      const audio = new Audio();
      audio.src = audioURL;
      
      // Criar contexto de áudio
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      // Criar source node
      const source = audioContext.createMediaElementSource(audio);
      
      // Criar destination para gravar o áudio processado
      const destination = audioContext.createMediaStreamDestination();
      
      // Conectar source ao destination
      source.connect(destination);
      
      // Criar MediaRecorder para o destination
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm'
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Criar blob com os novos chunks
        const newBlob = new Blob(chunks, { type: 'audio/mpeg' });
        resolve(newBlob);
        
        // Limpar URL
        URL.revokeObjectURL(audioURL);
      };
      
      // Iniciar gravação
      mediaRecorder.start();
      
      // Reproduzir áudio
      audio.oncanplaythrough = () => {
        audio.play();
      };
      
      // Quando o áudio terminar, parar a gravação
      audio.onended = () => {
        mediaRecorder.stop();
        audioContext.close();
      };
      
    } catch (error) {
      console.error('Erro ao converter áudio:', error);
      // Retornar o blob original em caso de erro
      reject(error);
    }
  });
};

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

  // Componente principal com o conteúdo original

  const promptParam = useParams<{ id: any; }>()
  
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [audioFile, setAudioFile] = useState<File | null | any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isAudioMode, setIsAudioMode] = useState(false) // Para controlar o modo de gravação/áudio
  const [audioVisualizerData, setAudioVisualizerData] = useState<number[]>([]) // Para armazenar dados da visualização de áudio
  const [isConverting, setIsConverting] = useState(false) // Estado para indicar conversão de áudio
  const [conversionProgress, setConversionProgress] = useState('') // Progresso da conversão
  const [promptHistory, setPromptHistory] = useState<PromptHistory[]>([]) // Lista de prompts salvos
  const [showPromptHistory, setShowPromptHistory] = useState(false) // Controla a exibição do histórico
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const visualizerIntervalRef = useRef<number | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!prompt.trim()) {
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
          text: prompt, 
          promptParam: promptParam.id,
          inputType: 'text' // Identificador do tipo de entrada
        })
      })

      if (!externalResponse.ok) {
        throw new Error(`HTTP error! status: ${externalResponse.status}`)
      }

      const externalData = await externalResponse.json()
      console.log('Resposta da API externa:', externalData)
      
      // Verificar se a resposta tem o formato esperado
      if (!externalData || !externalData[0] || !externalData[0].response) {
        throw new Error('Formato de resposta inválido da API externa')
      }
      
      // Processar a resposta
      const apiResponseText = externalData[0].response
        .replace(/\\n/g, '\n')          // Converter \n literal em quebras de linha reais
        .replace(/\\\"/g, '"')          // Converter \" em "
        .replace(/\\/g, '')             // Remover barras invertidas extras
        .replace(/\n\n+/g, '\n\n')      // Normalizar múltiplas quebras de linha
        .trim()                         // Remover espaços em branco extras

      setResponse(apiResponseText)
      
      // Salvar o prompt no nosso banco de dados
      const saveResponse = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: prompt,
          promptParam: promptParam.id,
          apiResponse: apiResponseText
        })
      })
      
      if (!saveResponse.ok) {
        console.error('Erro ao salvar prompt no banco de dados:', await saveResponse.text())
      } else {
        console.log('Prompt salvo com sucesso no banco de dados')
        const savedData = await saveResponse.json()
        console.log('Dados salvos:', savedData)
      }
      
      // Buscar o histórico atualizado de prompts
      const historyResponse = await fetch(`/api/prompts?accountId=${promptParam.id}`)
      
      if (historyResponse.ok) {
        const promptsData = await historyResponse.json()
        console.log('Histórico de prompts atualizado:', promptsData)
        setPromptHistory(promptsData)
      } else {
        console.error('Erro ao buscar histórico de prompts:', await historyResponse.text())
      }
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to get response from server')
      setResponse('')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('useEffect executado')
    
    if (promptParam && promptParam.id.length > 0) {
      console.log('Fazendo requisição com o prompt:', promptParam)
      
      // Buscar o histórico de prompts do nosso banco de dados
      const fetchPromptData = async () => {
        try {
          // Buscar o histórico de prompts
          const historyResponse = await fetch(`/api/prompts?accountId=${promptParam.id}`)
          
          if (historyResponse.ok) {
            const promptsData = await historyResponse.json()
            
            // Atualizar o histórico
            setPromptHistory(promptsData)
            
            // Se existir algum prompt, mostrar o mais recente na área de resposta
            if (promptsData && promptsData.length > 0) {
              const latestPrompt = promptsData[0] // Como ordenamos por data decrescente, o primeiro é o mais recente
              // Verifica se temos o prompt_complete, caso contrário usa o prompt original
              setResponse(latestPrompt.prompt_complete || latestPrompt.prompt)
            }
          } else {
            console.error('Erro ao buscar dados dos prompts:', await historyResponse.text())
          }
        } catch (error) {
          console.error('Erro ao buscar dados dos prompts:', error)
          }
      }
      
      // Executar a busca de dados
      fetchPromptData()
    }
  }, [promptParam]) 

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
        setAudioFile(file)
        setError('')
      } else {
        console.error(`Arquivo inválido selecionado: ${file.name} (${file.type})`)
        setError('Por favor, selecione um arquivo de áudio válido (mp3, mp4, ogg, webm, wav, etc)')
        setAudioFile(null)
      }
    }
  }

  // Função para enviar o arquivo de áudio
  const handleAudioUpload = async (file: File) => {
    if (!file) {
      setError('Arquivo de áudio inválido')
      return
    }

    try {
      setIsLoading(true)
      setResponse('')
      setConversionProgress('Preparando arquivo de áudio...')
      setIsConverting(true)

      // Converter qualquer formato de áudio para mp3
      let finalFile = file;
      
      // Tentar converter qualquer formato de áudio para MP3 para maior compatibilidade
      try {
        // Pegamos a extensão do arquivo para determinar o tipo
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        // Se já for MP3, não precisa converter
        if (file.type.includes('mp3') || file.type.includes('mpeg') || fileExtension === '.mp3') {
          console.log('Arquivo já está em formato MP3, pulando conversão');
          setConversionProgress('Arquivo já está em formato MP3');
        } else {
          // Caso contrário, tentamos converter
          setConversionProgress(`Convertendo ${fileExtension} para MP3...`);
          console.log(`Iniciando conversão de ${file.name} (${file.size} bytes, ${file.type})`);
          
          // Converter o arquivo para mp3
          const fileBlob = file.slice(0, file.size, file.type);
          const mp3Blob = await convertWebmToMp3(fileBlob);
          
          // Criar novo nome com extensão .mp3
          const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
          const fileName = `${fileNameWithoutExt}.mp3`;
          
          // Criar novo arquivo MP3
          finalFile = new File([mp3Blob], fileName, { 
            type: 'audio/mpeg',
            lastModified: new Date().getTime()
          });
          
          console.log(`Conversão concluída: ${finalFile.name} (${finalFile.size} bytes, ${finalFile.type})`);
          setConversionProgress('Conversão concluída!');
        }
      } catch (conversionError) {
        console.error('Erro na conversão do áudio:', conversionError);
        setConversionProgress('Erro na conversão, usando arquivo original...');
      }

      setIsConverting(false)
      setConversionProgress('')
      
      // Criar FormData para enviar o arquivo
      const formData = new FormData()
      formData.append('audio', finalFile)
      formData.append('inputType', 'audio') // Identificador para o backend saber que é um áudio
      
      if (promptParam) {
        formData.append('account_id', promptParam.id)
      }

      // FormData vai configurar o Content-Type como multipart/form-data automaticamente
      const response = await fetch('https://webhookn8n.lumibot.com.br/webhook/create/prompt', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Resposta da API de upload de áudio:', data)
      
      // Verifica se a resposta tem o formato esperado
      if (!data || !data[0] || !data[0].text) {
        throw new Error('Formato de resposta inválido da API de áudio')
      }
      
      // Processa a resposta da mesma forma que o texto
      const apiResponseText = data[0].text
        .replace(/\\n/g, '\n')
        .replace(/\\\"/g, '"')
        .replace(/\\/g, '')
        .replace(/\n\n+/g, '\n\n')
        .trim()
      
      setResponse(apiResponseText)
      
      // Salvar o prompt no nosso banco de dados
      try {
        console.log('Salvando resultado do upload de áudio no banco de dados')
        const saveResponse = await fetch('/api/prompts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: `Áudio: ${finalFile.name}`,
            promptParam: promptParam.id,
            apiResponse: apiResponseText
          })
        })
        
        if (!saveResponse.ok) {
          console.error('Erro ao salvar prompt do áudio no banco de dados:', await saveResponse.text())
        } else {
          console.log('Prompt de áudio salvo com sucesso')
          const savedData = await saveResponse.json()
          console.log('Dados do áudio salvos:', savedData)
        }
        
        // Buscar o histórico atualizado de prompts
        const historyResponse = await fetch(`/api/prompts?accountId=${promptParam.id}`)
        
        if (historyResponse.ok) {
          const promptsData = await historyResponse.json()
          console.log('Histórico de prompts atualizado após áudio:', promptsData)
          setPromptHistory(promptsData)
        } else {
          console.error('Erro ao buscar histórico de prompts após áudio:', await historyResponse.text())
        }
      } catch (dbError) {
        console.error('Erro ao interagir com o banco de dados:', dbError)
      }
      
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
      setResponse('')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Função para lidar com o envio manual de áudio
  // const handleAudioSubmit = () => {
  //   if (audioFile) {
  //     handleAudioUpload(audioFile)
  //   } else {
  //     setError('Por favor, selecione um arquivo de áudio')
  //   }
  // }
  
  // Função para deletar o áudio gravado
  const deleteAudio = () => {
    setAudioFile(null)
    setIsAudioMode(false)
    
    // Limpar o input de arquivo, se existir
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // Garantir que o visualizador de áudio está parado
    stopAudioVisualizer()
  }
  
  // Função para parar o visualizador de áudio
  const stopAudioVisualizer = () => {
    if (visualizerIntervalRef.current) {
      window.clearInterval(visualizerIntervalRef.current)
      visualizerIntervalRef.current = null
    }
    
    // Limpar os dados do visualizador
    setAudioVisualizerData([])
    
    // Fechar contexto de áudio se existir
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error)
    }
  }

  // Função para iniciar ou parar a gravação de áudio
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording()
      return
    }
    
    // Entrar no modo áudio
    setIsAudioMode(true)

    try {
      // Solicitar permissão para acessar o microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Configurar visualizador de áudio
      try {
        // Criar contexto de áudio
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        audioContextRef.current = new AudioContext()
        
        // Criar fonte de áudio a partir do stream
        const source = audioContextRef.current.createMediaStreamSource(stream)
        
        // Criar analisador
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        
        // Conectar fonte ao analisador
        source.connect(analyserRef.current)
        
        // Configurar intervalo para ler dados do analisador
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        
        visualizerIntervalRef.current = window.setInterval(() => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray)
            // Criar um array menor para melhor renderização (pegamos apenas alguns valores)
            const visualData = Array.from(dataArray.filter((_, i) => i % 4 === 0))
              .map(val => val / 255) // Normalizar entre 0 e 1
            setAudioVisualizerData(visualData)
          }
        }, 100)
      } catch (visualizerError) {
        console.error('Erro ao configurar visualizador de áudio:', visualizerError)
      }
      
      // Criar novo MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      // Evento para capturar os chunks de áudio
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      // Evento quando a gravação termina
      mediaRecorder.onstop = async () => {
        // Criar um Blob com todos os chunks usando webm (formato nativo do navegador)
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        // Definir um nome de arquivo com timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const fileName = `instrucao_audio_${timestamp}.webm`
        
        // Criar um File a partir do Blob
        const audioFile = new File([audioBlob], fileName, { type: 'audio/webm' })
        
        // Atualizar o estado
        setAudioFile(audioFile)
        setIsRecording(false)
        setIsAudioMode(true) // Manter no modo áudio para exibir opções de gerenciamento
        
        // Parar o timer
        if (timerRef.current) {
          window.clearInterval(timerRef.current)
          timerRef.current = null
        }
        
        // Parar todas as faixas do stream
        stream.getTracks().forEach(track => track.stop())
        
        // Não enviar automaticamente, deixar o usuário decidir
        // await handleAudioUpload(audioFile)
      }
      
      // Iniciar a gravação
      mediaRecorder.start(200) // Coleta chunks a cada 200ms
      setIsRecording(true)
      setRecordingTime(0)
      
      // Iniciar o timer para mostrar o tempo de gravação
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      // Definir um tempo máximo de gravação (30 segundos)
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording()
        }
      }, 30000) // 30 segundos
      
    } catch (error) {
      console.error('Erro ao acessar o microfone:', error)
      setError('Não foi possível acessar o microfone. Verifique as permissões do navegador.')
    }
  }
  
  // Função para parar a gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    // Parar o visualizador de áudio
    stopAudioVisualizer()
  }
  
  // Função para formatar o tempo de gravação
  const formatRecordingTime = () => {
    const minutes = Math.floor(recordingTime / 60)
    const seconds = recordingTime % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  // Função para abrir o seletor de arquivo (para upload manual)
  const triggerFileInput = () => {
    setIsAudioMode(true) // Ativar o modo áudio para arquivos também
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
  
  // Função para restaurar um prompt
  const restorePrompt = async (promptId: string) => {
    try {
      setIsLoading(true)
      setError('')
      
      // Fazer a requisição para nossa API interna
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
      
      // Atualizar a resposta com o prompt completo ou original
      if (data.success) {
        // Mostrar o prompt completo se existir, caso contrário o original
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
  
  // Função para alternar a exibição do histórico de prompts
  const togglePromptHistory = () => {
    setShowPromptHistory(!showPromptHistory)
  }

  return (
    <div className="min-h-screen bg-gray-900 py-6 flex flex-col justify-center sm:py-12">
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-semibold text-center mb-8 text-white">
              Gerador de Instrução
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isAudioMode && (
                <div>
                  <label htmlFor="prompt" className="text-sm font-medium text-gray-300 block mb-2">
                    Escreva sua Instruçao:
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
              )}

              {error && (
                <div className="text-red-400 text-sm py-2 px-3 bg-red-900/50 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                {/* Modo normal: exibe botão de envio de texto e opções de áudio */}
                {!isAudioMode && (
                  <>
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
                      onClick={toggleRecording}
                      disabled={isLoading}
                      className="flex items-center justify-center py-3 px-4 rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Gravar áudio"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                    
                    {/* Botão para upload manual de áudio */}
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      disabled={isLoading}
                      className="flex items-center justify-center py-3 px-4 rounded-lg text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Carregar arquivo de áudio"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </button>
                  </>
                )}
                
                {/* Modo de gravação - exibe contador e botão para parar */}
                {isAudioMode && isRecording && (
                  <>
                    <div className="flex-grow flex flex-col items-center justify-center py-3 px-4 rounded-lg text-white bg-gray-700">
                      <div className="flex items-center mb-2">
                        <div className="animate-pulse mr-2 h-3 w-3 rounded-full bg-red-500"></div>
                        <span className="font-medium">Gravando: {formatRecordingTime()}</span>
                      </div>
                      
                      {/* Visualizador de ondas de áudio */}
                      {audioVisualizerData.length > 0 && (
                        <div className="flex items-end h-10 w-full space-x-px mt-1">
                          {audioVisualizerData.map((value, index) => (
                            <div
                              key={index}
                              className="w-1 bg-orange-500 rounded-t"
                              style={{ 
                                height: `${Math.max(4, value * 40)}px`,
                                opacity: 0.7 + value * 0.3
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center justify-center py-3 px-4 rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
                      title="Parar gravação"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
                      </svg>
                    </button>
                  </>
                )}
                
                {/* Modo de áudio com arquivo pronto para envio */}
                {isAudioMode && !isRecording && audioFile  && (
                  <>
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
                      onClick={() => handleAudioUpload(audioFile as any)}
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
                      onClick={deleteAudio}
                      disabled={isLoading}
                      className="flex items-center justify-center py-3 px-4 rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Deletar áudio"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
                
                {/* Input oculto para seleção de arquivo */}
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAudioFileChange}
                  accept="audio/mp3,audio/mpeg,audio/mp4,audio/ogg,audio/webm,audio/wav,audio/*"
                  className="hidden"
                />
              </div>
            </form>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-medium text-gray-300">Instrução Gerada:</h2>
                <button
                  type="button"
                  onClick={togglePromptHistory}
                  className="text-xs px-3 py-1 rounded-md bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                >
                  {showPromptHistory ? 'Esconder Histórico' : 'Mostrar Histórico'}
                </button>
              </div>
              
              {/* Histórico de prompts */}
              {showPromptHistory && (
                <div className="mb-6 bg-gray-700 rounded-lg overflow-hidden">
                  <div className="p-3 bg-gray-600 border-b border-gray-500">
                    <h3 className="text-sm font-medium text-white">Histórico de Instruções</h3>
                    <p className="text-xs text-gray-300 mt-1">Clique em uma instrução para restaurá-la</p>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {promptHistory.length > 0 ? (
                      <ul className="divide-y divide-gray-600">
                        {promptHistory.map((item) => (
                          <li key={item.id} className="p-3 hover:bg-gray-600 transition-colors">
                            <button
                              onClick={() => restorePrompt(item.id)}
                              className="w-full text-left"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1 pr-4">
                                  <p className="text-xs font-medium text-white line-clamp-2">
                                    {item.prompt?.substring(0, 150)}
                                    {item.prompt?.length > 150 ? '...' : ''}
                                  </p>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                  {item.created_at ? format(new Date(item.created_at), 'dd/MM/yy HH:mm') : '-'}
                                </span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        Nenhuma instrução no histórico
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="bg-gray-700 text-gray-300 text-sm font-extralight rounded-lg p-6 min-h-[200px] overflow-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-400">Generating response...</span>
                  </div>
                ) : response ? (
                  <div className="prose prose-invert prose-pre:bg-gray-800 prose-pre:text-gray-100 max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        p: ({ children, ...props }: ComponentPropsWithoutRef<'p'>) => (
                          <p className="mb-4 text-sm font-extralight whitespace-pre-line" {...props}>{children}</p>
                        ),
                        pre: ({ children, ...props }: ComponentPropsWithoutRef<'pre'>) => (
                          <pre className="p-4 rounded-lg text-sm font-extralight bg-gray-800 overflow-auto" {...props}>{children}</pre>
                        ),
                        code: ({ children, className, ...props }: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) => (
                          props.inline
                            ? <code className="bg-gray-800 text-sm font-extralight px-1 py-0.5 rounded">{children}</code>
                            : <code className="block" {...props}>{children}</code>
                        ),
                      }}
                    >
                      {response}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-500">Sua instrução sera gerada aqui...</span>
                  </div>
                )}
              </div>
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
