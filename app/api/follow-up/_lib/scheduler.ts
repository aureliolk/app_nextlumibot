// app/api/follow-up/_lib/scheduler.ts

// Importações necessárias
import prisma from '@/lib/db';
import axios from 'axios'; // Usando axios que já deve estar instalado

// Mapa para armazenar timeouts ativos
const activeTimeouts: Map<string, NodeJS.Timeout> = new Map();

// Interface para as mensagens agendadas
interface ScheduledMessage {
  followUpId: string;
  stepIndex: number;
  message: string;
  scheduledTime: Date;
  clientId: string;
  metadata?: Record<string, any>;
}

// Função para agendar uma mensagem
export async function scheduleMessage(message: ScheduledMessage): Promise<string> {
  try {
    const messageId = `${message.followUpId}-${message.stepIndex}`;
    
    // Cancelar qualquer timeout existente para este ID
    if (activeTimeouts.has(messageId)) {
      clearTimeout(activeTimeouts.get(messageId)!);
      activeTimeouts.delete(messageId);
    }
    
    // Calcular o atraso em milissegundos
    const delay = message.scheduledTime.getTime() - Date.now();
    
    // Se o tempo já passou ou é imediato, enviar agora
    if (delay <= 0) {
      await sendMessage(message);
      return messageId;
    }
    
    // Agendar o envio para o futuro
    const timeout = setTimeout(async () => {
      try {
        await sendMessage(message);
      } catch (error) {
        console.error(`Erro ao enviar mensagem agendada ${messageId}:`, error);
      } finally {
        // Remover do mapa após execução
        activeTimeouts.delete(messageId);
      }
    }, delay);
    
    // Armazenar o timeout
    activeTimeouts.set(messageId, timeout);
    
    console.log(`Mensagem ${messageId} agendada para ${message.scheduledTime.toISOString()}`);
    return messageId;
  } catch (error) {
    console.error("Erro ao agendar mensagem:", error);
    throw error;
  }
}

// Função para enviar a mensagem para a API Lumibot
async function sendMessageToLumibot(clientId: string, content: string): Promise<boolean> {
  try {
    // Configurações fixas para a API conforme solicitado
    const accountId = 10;
    const conversationId = 3;
    const apiToken = 'Z41o5FJFVEdZJjQaqDz6pYC7';
    
    // Fazer a requisição POST para a API usando axios
    const response = await axios.post(
      `https://app.lumibot.com.br/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
      {
        'content': content,
        'message_type': 'outgoing'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': apiToken
        }
      }
    );
    
    // O axios já lança um erro se a resposta não for bem-sucedida
    const responseData = response.data;
    console.log(`Mensagem enviada com sucesso para cliente ${clientId}:`, responseData);
    return true;
  } catch (error) {
    console.error(`Erro ao enviar mensagem para a API Lumibot:`, error);
    return false;
  }
}

// Função para enviar a mensagem
async function sendMessage(message: ScheduledMessage): Promise<void> {
  try {
    // Verificar se o follow-up ainda está ativo
    const followUp = await prisma.followUp.findUnique({
      where: { id: message.followUpId }
    });
    
    if (!followUp || followUp.status !== 'active') {
      console.log(`Follow-up ${message.followUpId} não está mais ativo, cancelando envio.`);
      return;
    }
    
    // Enviar a mensagem para a API Lumibot
    console.log(`Enviando mensagem do follow-up ${message.followUpId} etapa ${message.stepIndex} para cliente ${message.clientId}`);
    const success = await sendMessageToLumibot(message.clientId, message.message);
    
    if (success) {
      // Atualizar o status da mensagem no banco de dados
      const dbMessage = await prisma.followUpMessage.findFirst({
        where: {
          follow_up_id: message.followUpId,
          step: message.stepIndex
        },
        orderBy: { sent_at: 'desc' }
      });
      
      if (dbMessage) {
        await prisma.followUpMessage.update({
          where: { id: dbMessage.id },
          data: {
            delivered: true,
            delivered_at: new Date()
          }
        });
      }
      
      console.log(`Mensagem do follow-up ${message.followUpId} etapa ${message.stepIndex} enviada com sucesso.`);
    } else {
      // Registrar falha, pode ser útil implementar retry logic aqui
      console.error(`Falha ao enviar mensagem para cliente ${message.clientId} do follow-up ${message.followUpId}`);
    }
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    throw error;
  }
}

// Interface para o processador personalizado de mensagens
export interface MessageProcessor {
  process: (message: ScheduledMessage) => Promise<boolean>;
}

// Processador que integra com a API Lumibot
const lumibotProcessor: MessageProcessor = {
  process: async (message: ScheduledMessage) => {
    return await sendMessageToLumibot(message.clientId, message.message);
  }
};

// Definir o processador Lumibot como o padrão
let currentProcessor: MessageProcessor = lumibotProcessor;

// Função para cancelar todas as mensagens agendadas para um follow-up
export async function cancelScheduledMessages(followUpId: string): Promise<void> {
  try {
    // Encontrar todas as chaves no mapa que começam com o ID do follow-up
    const keysToRemove = Array.from(activeTimeouts.keys()).filter(key => 
      key.startsWith(`${followUpId}-`)
    );
    
    // Cancelar cada timeout e remover do mapa
    keysToRemove.forEach(key => {
      clearTimeout(activeTimeouts.get(key)!);
      activeTimeouts.delete(key);
    });
    
    console.log(`${keysToRemove.length} mensagens agendadas canceladas para o follow-up ${followUpId}.`);
  } catch (error) {
    console.error("Erro ao cancelar mensagens agendadas:", error);
    throw error;
  }
}

// Função para carregar e reagendar mensagens pendentes na inicialização do servidor
export async function reloadPendingMessages(): Promise<void> {
  // Implementação existente...
}

// Exportar as funções necessárias
export function setMessageProcessor(processor: MessageProcessor): void {
  currentProcessor = processor;
  console.log("Processador de mensagens personalizado configurado.");
}

export function getMessageProcessor(): MessageProcessor {
  return currentProcessor;
}

// Inicialização - carregar mensagens pendentes na inicialização do servidor
if (typeof window === 'undefined') { // Verificar se estamos no lado do servidor
  // Usar setTimeout para aguardar a inicialização completa do servidor
  setTimeout(() => {
    reloadPendingMessages().catch(error => {
      console.error("Erro ao inicializar o agendador de mensagens:", error);
    });
  }, 5000); // Aguardar 5 segundos após a inicialização
}