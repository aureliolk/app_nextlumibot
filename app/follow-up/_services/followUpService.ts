// app/follow-up/_services/followUpService.ts
import axios from 'axios';
import { FollowUp, Campaign, CampaignStep, FunnelStage, FunnelStep } from '../_types';

export const followUpService = {
  // Função para buscar follow-ups
  async getFollowUps(status?: string): Promise<FollowUp[]> {
    try {
      const response = await axios.get('/api/follow-up', {
        params: status ? { status } : undefined
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch follow-ups');
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      throw error;
    }
  },

  // Função para buscar campanhas
  async getCampaigns(): Promise<Campaign[]> {
    try {
      const response = await axios.get('/api/follow-up/campaigns');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch campaigns');
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  },

  // Função para buscar uma campanha específica
  async getCampaign(campaignId: string): Promise<Campaign> {
    try {
      const response = await axios.get(`/api/follow-up/campaigns/${campaignId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch campaign');
      }
      
      const campaignData = response.data.data;
      
      // Processar os steps se estiverem em formato string
      let steps = [];
      if (typeof campaignData.steps === 'string') {
        try {
          steps = JSON.parse(campaignData.steps);
        } catch (e) {
          console.error('Error parsing steps:', e);
          steps = [];
        }
      } else {
        steps = campaignData.steps || [];
      }
      
      return {
        ...campaignData,
        steps
      };
    } catch (error) {
      console.error('Error fetching campaign:', error);
      throw error;
    }
  },

  // Função para buscar estágios do funil
  async getFunnelStages(): Promise<FunnelStage[]> {
    try {
      const response = await axios.get('/api/follow-up/funnel-stages');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch funnel stages');
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching funnel stages:', error);
      throw error;
    }
  },
  
  // Função para criar um novo estágio do funil
  async createFunnelStage(name: string, description?: string, order?: number): Promise<FunnelStage> {
    try {
      const response = await axios.post('/api/follow-up/funnel-stages', {
        name,
        description,
        order
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create funnel stage');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error creating funnel stage:', error);
      throw error;
    }
  },
  
  // Função para atualizar um estágio do funil
  async updateFunnelStage(id: string, data: { name: string, description?: string, order?: number }): Promise<FunnelStage> {
    try {
      const response = await axios.put('/api/follow-up/funnel-stages', {
        id,
        ...data
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update funnel stage');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error updating funnel stage:', error);
      throw error;
    }
  },
  
  // Função para excluir um estágio do funil
  async deleteFunnelStage(id: string): Promise<boolean> {
    try {
      const response = await axios.delete(`/api/follow-up/funnel-stages?id=${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete funnel stage');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting funnel stage:', error);
      throw error;
    }
  },

  // Função para buscar passos de um estágio específico
  async getFunnelSteps(stageId: string): Promise<FunnelStep[]> {
    try {
      const response = await axios.get(`/api/follow-up/funnel-steps?stageId=${stageId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch funnel steps');
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching steps for stage ${stageId}:`, error);
      throw error;
    }
  },

  // Função unificada para buscar todos os estágios e passos
  async getCampaignSteps(campaignId?: string): Promise<CampaignStep[]> {
    try {
      // 1. Primeiro, buscar todos os estágios do funil
      const funnelStages = await this.getFunnelStages();
      
      // 2. Para cada estágio, buscar os passos associados
      const allSteps: CampaignStep[] = [];
      
      for (const stage of funnelStages) {
        try {
          const steps = await this.getFunnelSteps(stage.id);
          
          // Mapear passos para o formato esperado
          const formattedSteps = steps.map((step: FunnelStep) => ({
            id: step.id,
            etapa: stage.name,
            tempo_de_espera: step.wait_time,
            template_name: step.template_name,
            message: step.message_content,
            stage_id: stage.id,
            stage_name: stage.name,
            stage_order: stage.order
          }));
          
          allSteps.push(...formattedSteps);
        } catch (error) {
          console.error(`Error processing steps for stage ${stage.name}:`, error);
        }
      }
      
      // 3. Se não foram encontrados passos ou se um ID de campanha foi fornecido,
      // buscar dados da campanha
      if ((allSteps.length === 0 || campaignId) && campaignId) {
        try {
          const campaign = await this.getCampaign(campaignId);
          
          if (campaign && (campaign.steps?.length > 0)) {
            // Mapear para o formato esperado
            const formattedCampaignSteps = campaign.steps.map((step: any, index: number) => {
              if (step.stage_name) {
                return {
                  id: `campaign-step-${index}`,
                  etapa: step.stage_name,
                  tempo_de_espera: step.wait_time || '',
                  template_name: step.template_name || '',
                  message: step.message || '',
                  stage_name: step.stage_name,
                  stage_order: step.stage_order
                };
              } else if (step.etapa) {
                return {
                  id: `campaign-step-${index}`,
                  etapa: step.etapa,
                  tempo_de_espera: step.tempo_de_espera || '',
                  template_name: step.nome_template || '',
                  message: step.mensagem || '',
                  stage_name: step.etapa,
                  stage_order: index
                };
              }
              return null;
            }).filter(Boolean);
            
            if (formattedCampaignSteps.length > 0) {
              // Se já temos alguns passos do banco de dados, apenas adicione os que faltam
              if (allSteps.length > 0) {
                // Verificar quais etapas já existem
                const existingStageNames = new Set(allSteps.map(step => step.etapa));
                const newSteps = formattedCampaignSteps.filter(step => !existingStageNames.has(step.etapa));
                allSteps.push(...newSteps);
              } else {
                allSteps.push(...formattedCampaignSteps);
              }
            }
          }
        } catch (campaignError) {
          console.error('Error fetching campaign data:', campaignError);
        }
      }
      
      return allSteps;
    } catch (error) {
      console.error('Error fetching campaign steps:', error);
      throw error;
    }
  },

  // Função para cancelar um follow-up
  async cancelFollowUp(followUpId: string): Promise<any> {
    try {
      const response = await axios.post('/api/follow-up/cancel', { 
        followUpId 
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to cancel follow-up');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error canceling follow-up:', error);
      throw error;
    }
  },

  // Função para remover um cliente
  async removeClient(clientId: string): Promise<any> {
    try {
      const response = await axios.post('/api/follow-up/remove-client', { 
        clientId 
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to remove client');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error removing client:', error);
      throw error;
    }
  },
  
  // Função para mover um cliente para outra etapa do funil
  async moveClientToStage(followUpId: string, stageId: string): Promise<any> {
    try {
      const response = await axios.put(`/api/follow-up/${followUpId}/move-stage`, {
        stageId
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to move client to stage');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error moving client to stage:', error);
      throw error;
    }
  },
  
  // Função para criar um novo follow-up
  async createFollowUp(clientId: string, campaignId: string): Promise<any> {
    try {
      const response = await axios.post('/api/follow-up', {
        clientId,
        campaignId
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create follow-up');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating follow-up:', error);
      throw error;
    }
  },

  // Função para atualizar uma campanha
  async updateCampaign(campaignId: string, formData: any): Promise<any> {
    try {
      const response = await axios.put(`/api/follow-up/campaigns/${campaignId}`, formData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update campaign');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  }
};

export default followUpService;