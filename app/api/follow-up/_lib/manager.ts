// app/api/follow-up/_lib/manager.ts
import prisma from '@/lib/db';
import { scheduleMessage, cancelScheduledMessages } from './scheduler';
import path from 'path';
import fs from 'fs/promises';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Interface para os dados do CSV de follow-up
interface FollowUpStep {
  etapa: string;
  mensagem: string;
  tempo_de_espera: string; // Formato esperado: "1d", "2h", "30m", etc.
  condicionais?: string;
}

// Função para converter string de tempo em milissegundos
export function parseTimeString(timeStr: string): number {
  // Se o tempo estiver vazio ou for inválido, usar 30 minutos como padrão
  if (!timeStr || timeStr.trim() === "") {
    console.log("Tempo de espera não definido, usando padrão de 30 minutos");
    return 30 * 60 * 1000; // 30 minutos
  }

  const units: Record<string, number> = {
    's': 1000,           // segundos
    'm': 60 * 1000,      // minutos
    'h': 60 * 60 * 1000, // horas
    'd': 24 * 60 * 60 * 1000, // dias
  };

  // Tentar converter formatos específicos como "10 minutos", "1 hora", etc.
  if (timeStr.includes("minutos") || timeStr.includes("minuto")) {
    const minutos = parseInt(timeStr);
    return isNaN(minutos) ? 30 * 60 * 1000 : minutos * 60 * 1000;
  } else if (timeStr.includes("hora") || timeStr.includes("horas")) {
    const horas = parseInt(timeStr);
    return isNaN(horas) ? 60 * 60 * 1000 : horas * 60 * 60 * 1000;
  } else if (timeStr.includes("dias") || timeStr.includes("dia")) {
    const dias = parseInt(timeStr);
    return isNaN(dias) ? 24 * 60 * 60 * 1000 : dias * 24 * 60 * 60 * 1000;
  } else if (timeStr.toLowerCase() === "imediatamente") {
    return 1000; // 1 segundo, praticamente imediato
  }

  // Formato padrão: "30m", "2h", "1d"
  const match = timeStr.match(/^(\d+)([smhd])$/i);
  if (!match) {
    console.warn(`Formato de tempo inválido: ${timeStr}. Usando padrão de 30 minutos`);
    return 30 * 60 * 1000; // 30 minutos como padrão
  }

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  if (!(unit in units)) {
    console.warn(`Unidade de tempo desconhecida: ${unit}. Usando padrão de 30 minutos`);
    return 30 * 60 * 1000;
  }

  return value * units[unit];
}

// Função para processar o CSV e carregar os dados do funil
export async function loadFollowUpData(campaignId?: string): Promise<FollowUpStep[]> {
  try {
    // Se temos um ID de campanha, carregar do banco de dados
    if (campaignId) {
      const campaign = await prisma.followUpCampaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        throw new Error(`Campanha de follow-up não encontrada: ${campaignId}`);
      }

      // Retornar os passos da campanha
      return JSON.parse(campaign.steps as string) as FollowUpStep[];
    }

    // Caso contrário, carregar do arquivo CSV mais recente
    const csvFilePath = path.join(process.cwd(), 'public', 'follow-up-sabrina-nunes-atualizado.csv');
    
    // Verificar se o arquivo existe
    try {
      await fs.access(csvFilePath);
    } catch (error) {
      throw new Error(`Arquivo CSV não encontrado em ${csvFilePath}`);
    }

    // Ler o arquivo CSV
    const fileContent = await fs.readFile(csvFilePath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      const results: FollowUpStep[] = [];
      
      // Criar um stream a partir do conteúdo do arquivo
      const stream = Readable.from([fileContent]);
      
      stream
        .pipe(csv({
          separator: ',',
          headers: [
            'etapa', 
            'tempo_de_espera', 
            'template_name', 
            'category', 
            'mensagem', 
            'auto_respond', 
            'status'
          ]
        }))
        .on('data', (data) => {
          // Filtrar cabeçalhos ou linhas vazias
          if (data.etapa && data.etapa !== 'Etapa do Funil') {
            results.push(data);
          }
        })
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  } catch (error) {
    console.error("Erro ao carregar dados de follow-up:", error);
    throw error;
  }
}

// Função principal para processar as etapas de follow-up
export async function processFollowUpSteps(followUpId: string): Promise<void> {
  try {
    // Carregar o follow-up do banco de dados
    const followUp = await prisma.followUp.findUnique({
      where: { id: followUpId },
      include: {
        campaign: true
      }
    });

    if (!followUp) {
      throw new Error(`Follow-up não encontrado: ${followUpId}`);
    }

    // Verificar se o follow-up está ativo
    if (followUp.status !== 'active') {
      console.log(`Follow-up ${followUpId} não está ativo, status atual: ${followUp.status}`);
      return;
    }

    // Carregar as etapas da campanha
    const steps = followUp.campaign?.steps
      ? JSON.parse(followUp.campaign.steps as string) as FollowUpStep[]
      : await loadFollowUpData();

    if (!steps || steps.length === 0) {
      throw new Error("Nenhuma etapa de follow-up encontrada");
    }

    // Verificar qual é a etapa atual
    const currentStepIndex = followUp.current_step;
    
    // Se já completou todas as etapas, marcar como concluído
    if (currentStepIndex >= steps.length) {
      await prisma.followUp.update({
        where: { id: followUpId },
        data: {
          status: 'completed',
          completed_at: new Date()
        }
      });
      console.log(`Follow-up ${followUpId} concluído com sucesso.`);
      return;
    }

    // Obter a etapa atual
    const currentStep = steps[currentStepIndex];
    
    // Calcular o tempo de espera para a próxima mensagem
    const waitTime = parseTimeString(currentStep.tempo_de_espera);
    
    // Calcular o horário da próxima mensagem
    const nextMessageTime = new Date(Date.now() + waitTime);
    
    // Atualizar o follow-up com o horário da próxima mensagem
    await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        next_message_at: nextMessageTime
      }
    });

    // Registrar a mensagem atual
    await prisma.followUpMessage.create({
      data: {
        follow_up_id: followUpId,
        step: currentStepIndex,
        content: currentStep.mensagem || currentStep.message,
        funnel_stage: currentStep.etapa || currentStep.stage_name,
        template_name: currentStep.template_name,
        category: currentStep.category,
        sent_at: new Date(),
        delivered: false
      }
    });

    // Agendar o envio da mensagem atual
    await scheduleMessage({
      followUpId,
      stepIndex: currentStepIndex,
      message: currentStep.mensagem,
      scheduledTime: new Date(), // Enviar imediatamente
      clientId: followUp.client_id
    });

    // Agendar a próxima etapa se o cliente não responder
    await scheduleNextStep(followUpId, currentStepIndex + 1, nextMessageTime);

    console.log(`Processamento da etapa ${currentStepIndex} do follow-up ${followUpId} agendado com sucesso.`);
  } catch (error) {
    console.error("Erro ao processar etapas de follow-up:", error);
    throw error;
  }
}

// Função para agendar a próxima etapa
export async function scheduleNextStep(
  followUpId: string,
  nextStepIndex: number,
  scheduledTime: Date
): Promise<void> {
  try {
    // Verificar se o follow-up existe e está ativo
    const followUp = await prisma.followUp.findUnique({
      where: { id: followUpId },
      include: { campaign: true }
    });

    if (!followUp) {
      throw new Error(`Follow-up não encontrado: ${followUpId}`);
    }

    if (followUp.status !== 'active') {
      console.log(`Follow-up ${followUpId} não está ativo, status atual: ${followUp.status}`);
      return;
    }

    // Carregar as etapas da campanha
    const steps = followUp.campaign?.steps
      ? JSON.parse(followUp.campaign.steps as string) as FollowUpStep[]
      : await loadFollowUpData();

    // Verificar se ainda há etapas restantes
    if (nextStepIndex >= steps.length) {
      console.log(`Follow-up ${followUpId} já atingiu a última etapa.`);
      
      // Agendar um evento para completar o follow-up
      setTimeout(async () => {
        await prisma.followUp.update({
          where: { id: followUpId },
          data: {
            status: 'completed',
            completed_at: new Date()
          }
        });
        console.log(`Follow-up ${followUpId} marcado como completo.`);
      }, scheduledTime.getTime() - Date.now());
      
      return;
    }

    // Agendar a execução da próxima etapa no tempo especificado
    setTimeout(async () => {
      try {
        // Verificar se o follow-up ainda está ativo e não foi cancelado
        const currentFollowUp = await prisma.followUp.findUnique({
          where: { id: followUpId }
        });

        if (!currentFollowUp || currentFollowUp.status !== 'active') {
          console.log(`Follow-up ${followUpId} não está mais ativo, cancelando próxima etapa.`);
          return;
        }

        // Verificar se o cliente respondeu
        if (currentFollowUp.is_responsive) {
          console.log(`Cliente respondeu ao follow-up ${followUpId}, pausando sequência.`);
          
          // Atualizar status para "pausado"
          await prisma.followUp.update({
            where: { id: followUpId },
            data: {
              status: 'paused'
            }
          });
          
          return;
        }

        // Atualizar o follow-up para a próxima etapa
        await prisma.followUp.update({
          where: { id: followUpId },
          data: {
            current_step: nextStepIndex
          }
        });

        // Processar a próxima etapa
        await processFollowUpSteps(followUpId);
      } catch (error) {
        console.error(`Erro ao processar próxima etapa do follow-up ${followUpId}:`, error);
      }
    }, scheduledTime.getTime() - Date.now());

    console.log(`Próxima etapa do follow-up ${followUpId} agendada para ${scheduledTime.toISOString()}`);
  } catch (error) {
    console.error("Erro ao agendar próxima etapa:", error);
    throw error;
  }
}

// Função para reiniciar um follow-up pausado
export async function resumeFollowUp(followUpId: string): Promise<void> {
  try {
    const followUp = await prisma.followUp.findUnique({
      where: { id: followUpId }
    });

    if (!followUp) {
      throw new Error(`Follow-up não encontrado: ${followUpId}`);
    }

    if (followUp.status !== 'paused') {
      console.log(`Follow-up ${followUpId} não está pausado, status atual: ${followUp.status}`);
      return;
    }

    // Atualizar o status para ativo
    await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        status: 'active',
        is_responsive: false,
        next_message_at: new Date() // Reiniciar imediatamente
      }
    });

    // Processar a etapa atual novamente
    await processFollowUpSteps(followUpId);

    console.log(`Follow-up ${followUpId} reiniciado com sucesso.`);
  } catch (error) {
    console.error("Erro ao reiniciar follow-up:", error);
    throw error;
  }
}

// Função para avançar para a próxima etapa manualmente
export async function advanceToNextStep(followUpId: string): Promise<void> {
  try {
    const followUp = await prisma.followUp.findUnique({
      where: { id: followUpId },
      include: { campaign: true }
    });

    if (!followUp) {
      throw new Error(`Follow-up não encontrado: ${followUpId}`);
    }

    if (followUp.status !== 'active' && followUp.status !== 'paused') {
      console.log(`Follow-up ${followUpId} não está ativo ou pausado, status atual: ${followUp.status}`);
      return;
    }

    // Carregar as etapas da campanha
    const steps = followUp.campaign?.steps
      ? JSON.parse(followUp.campaign.steps as string) as FollowUpStep[]
      : await loadFollowUpData();

    const nextStepIndex = followUp.current_step + 1;

    // Verificar se ainda há etapas restantes
    if (nextStepIndex >= steps.length) {
      await prisma.followUp.update({
        where: { id: followUpId },
        data: {
          status: 'completed',
          completed_at: new Date()
        }
      });
      console.log(`Follow-up ${followUpId} completado por avanço manual.`);
      return;
    }

    // Atualizar o follow-up para a próxima etapa
    await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        current_step: nextStepIndex,
        status: 'active',
        is_responsive: false,
        next_message_at: new Date() // Executar próxima etapa imediatamente
      }
    });

    // Cancelar mensagens agendadas anteriormente
    await cancelScheduledMessages(followUpId);

    // Processar a próxima etapa
    await processFollowUpSteps(followUpId);

    console.log(`Follow-up ${followUpId} avançado manualmente para a etapa ${nextStepIndex}.`);
  } catch (error) {
    console.error("Erro ao avançar follow-up:", error);
    throw error;
  }
}

// Função para lidar com uma resposta do cliente
export async function handleClientResponse(
  clientId: string,
  message: string
): Promise<void> {
  try {
    // Buscar todos os follow-ups ativos para este cliente
    const activeFollowUps = await prisma.followUp.findMany({
      where: {
        client_id: clientId,
        status: { in: ['active', 'paused'] }
      }
    });

    if (activeFollowUps.length === 0) {
      console.log(`Nenhum follow-up ativo encontrado para o cliente ${clientId}.`);
      return;
    }

    // Atualizar todos os follow-ups ativos para este cliente como responsivos
    for (const followUp of activeFollowUps) {
      await prisma.followUp.update({
        where: { id: followUp.id },
        data: {
          is_responsive: true,
          status: followUp.status === 'active' ? 'paused' : followUp.status
        }
      });
      
      // Registrar a resposta do cliente
      await prisma.followUpMessage.create({
        data: {
          follow_up_id: followUp.id,
          step: -1, // Valor especial para indicar mensagem do cliente
          content: message,
          sent_at: new Date(),
          delivered: true,
          delivered_at: new Date()
        }
      });
      
      console.log(`Follow-up ${followUp.id} marcado como responsivo devido à mensagem do cliente.`);
    }
  } catch (error) {
    console.error("Erro ao lidar com resposta do cliente:", error);
    throw error;
  }
}

// Função para gerenciar importação inicial do CSV de follow-up para o banco de dados
export async function importFollowUpCampaign(
  name: string,
  description?: string
): Promise<string> {
  try {
    // Carregar dados do CSV
    const steps = await loadFollowUpData();
    
    if (!steps || steps.length === 0) {
      throw new Error("Nenhuma etapa encontrada no CSV");
    }
    
    // Criar uma nova campanha no banco de dados
    const campaign = await prisma.followUpCampaign.create({
      data: {
        name,
        description,
        active: true,
        steps: JSON.stringify(steps)
      }
    });
    
    console.log(`Campanha de follow-up "${name}" importada com sucesso, ID: ${campaign.id}`);
    return campaign.id;
  } catch (error) {
    console.error("Erro ao importar campanha de follow-up:", error);
    throw error;
  }
}