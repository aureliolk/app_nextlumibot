import { useState, useRef, useEffect } from 'react'

interface AudioRecorderProps {
  onAudioRecorded: (file: File) => void
  onCancel: () => void
}

const AudioRecorder = ({ onAudioRecorded, onCancel }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioVisualizerData, setAudioVisualizerData] = useState<number[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const visualizerIntervalRef = useRef<number | null>(null)

  // Inicia a gravação automaticamente quando o componente é montado
  useEffect(() => {
    startRecording()
    
    // Limpa recursos quando o componente é desmontado
    return () => {
      stopRecording()
      stopAudioVisualizer()
    }
  }, [])

  // Função para iniciar a gravação
  const startRecording = async () => {
    try {
      // Solicitar permissão para acessar o microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Configurar visualizador de áudio
      setupAudioVisualizer(stream)

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

        // Enviar o arquivo para o componente pai
        onAudioRecorded(audioFile)

        // Parar o timer
        if (timerRef.current) {
          window.clearInterval(timerRef.current)
          timerRef.current = null
        }

        // Parar todas as faixas do stream
        stream.getTracks().forEach(track => track.stop())
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
      onCancel() // Voltar ao estado anterior em caso de erro
    }
  }

  // Configurar o visualizador de áudio
  const setupAudioVisualizer = (stream: MediaStream) => {
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
    } catch (error) {
      console.error('Erro ao configurar visualizador de áudio:', error)
    }
  }

  // Função para parar a gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
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

  // Função para formatar o tempo de gravação
  const formatRecordingTime = () => {
    const minutes = Math.floor(recordingTime / 60)
    const seconds = recordingTime % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="text-white mb-2">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Gravando áudio:</h3>
      </div>
      
      <div className="flex gap-2">
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
      </div>
    </div>
  )
}

export default AudioRecorder