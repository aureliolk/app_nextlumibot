// lib/follow-up/scheduler.ts
import prisma from '@/lib/db';

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
    
    // Lógica para enviar a mensagem para o cliente
    // Aqui você pode integrar com sua API de mensagens (WhatsApp, SMS, email, etc.)
    console.log(`ENVIANDO MENSAGEM para cliente ${message.clientId}: ${message.message}`);
    
    // Na implementação real, esta seria a chamada para sua API de mensagens
    // Por exemplo: await sendWhatsAppMessage(message.clientId, message.message);
    
    // Simular envio bem-sucedido
    const success = true;
    
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
    }
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    throw error;
  }
}

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
  try {
    console.log("Carregando mensagens pendentes...");
    
    // Buscar todos os follow-ups ativos com mensagens agendadas
    const activeFollowUps = await prisma.followUp.findMany({
      where: {
        status: 'active',
        next_message_at: { not: null }
      }
    });
    
    if (activeFollowUps.length === 0) {
      console.log("Nenhuma mensagem pendente encontrada.");
      return;
    }
    
    console.log(`Encontrados ${activeFollowUps.length} follow-ups ativos com mensagens pendentes.`);
    
    // Reagendar cada mensagem
    for (const followUp of activeFollowUps) {
      if (!followUp.next_message_at) continue;
      
      // Verificar se a próxima mensagem já está no passado
      const now = new Date();
      let scheduledTime = followUp.next_message_at;
      
      // Se a mensagem já deveria ter sido enviada, enviar imediatamente
      if (scheduledTime < now) {
        scheduledTime = now;
      }
      
      try {
        // Carregar a mensagem atual
        const latestMessage = await prisma.followUpMessage.findFirst({
          where: { follow_up_id: followUp.id },
          orderBy: { sent_at: 'desc' }
        });
        
        if (!latestMessage) {
          console.log(`Nenhuma mensagem encontrada para o follow-up ${followUp.id}, iniciando do zero.`);
          
          // Iniciar o processamento do follow-up do zero
          // Importar a função para evitar referência circular
          const { processFollowUpSteps } = require('./manager');
          await processFollowUpSteps(followUp.id);
          continue;
        }
        
        // Agendar a mensagem
        await scheduleMessage({
          followUpId: followUp.id,
          stepIndex: followUp.current_step,
          message: latestMessage.content,
          scheduledTime,
          clientId: followUp.client_id
        });
        
        console.log(`Mensagem para follow-up ${followUp.id} reagendada para ${scheduledTime.toISOString()}.`);
      } catch (innerError) {
        console.error(`Erro ao reagendar mensagem para follow-up ${followUp.id}:`, innerError);
      }
    }
  } catch (error) {
    console.error("Erro ao recarregar mensagens pendentes:", error);
  }
}

// Interface para o processador personalizado de mensagens
export interface MessageProcessor {
  process: (message: ScheduledMessage) => Promise<boolean>;
}

// Processador padrão - apenas simula o envio
const defaultProcessor: MessageProcessor = {
  process: async (message: ScheduledMessage) => {
    console.log(`[SIMULAÇÃO] Enviando mensagem para ${message.clientId}: ${message.message}`);
    return true;
  }
};

// Processador de mensagens atual - pode ser substituído por uma implementação personalizada
let currentProcessor: MessageProcessor = defaultProcessor;

// Função para definir um processador personalizado
export function setMessageProcessor(processor: MessageProcessor): void {
  currentProcessor = processor;
  console.log("Processador de mensagens personalizado configurado.");
}

// Função para obter o processador atual
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