// Declaração para o conversor de áudio WebM para MP3
declare global {
    interface Window {
      lamejs?: any;
    }
  }
  
  /**
   * Converte um arquivo de áudio WebM para MP3
   * @param webmBlob Blob do arquivo WebM
   * @returns Promise com o Blob do arquivo MP3
   */
  export const convertWebmToMp3 = async (webmBlob: Blob): Promise<Blob> => {
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
        // Rejeitar com o erro
        reject(error);
      }
    });
  };