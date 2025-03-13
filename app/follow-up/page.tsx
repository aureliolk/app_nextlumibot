// app/follow-up/page.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

// Importando os componentes
import {
  ErrorMessage,
  ActionBar,
  NewFollowUpForm,
  FollowUpTable,
  FollowUpDetailModal,
  Footer,
  Header
} from './_components';
import MainNavigation from './_components/MainNavigation';

// Importando os tipos
import { FollowUp, Campaign, CampaignStep } from './_types';

export default function FollowUpPage() {
  // Estados
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'paused', 'completed', 'canceled'
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [campaignSteps, setCampaignSteps] = useState<CampaignStep[]>([]);

  // Função para carregar os follow-ups
  const fetchFollowUps = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/follow-up?status=${activeTab}`);
      setFollowUps(response.data.data || []);
    } catch (err: any) {
      console.error('Erro ao carregar follow-ups:', err);
      setError(err.response?.data?.error || 'Falha ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para carregar as campanhas
  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('/api/follow-up/campaigns');
      console.log('Campanhas carregadas:', response.data.data);
      setCampaigns(response.data.data || []);
    } catch (err: any) {
      console.error('Erro ao carregar campanhas:', err);
    }
  };

  // Função para buscar as etapas e estágios do funil
  const fetchCampaignSteps = async (campaignId: string) => {
    try {
      setIsLoading(true);
      
      console.log('Buscando etapas e estágios para a campanha:', campaignId);
      
      // 1. Primeiro, buscar todas as etapas do funil
      const stagesResponse = await axios.get('/api/follow-up/funnel-stages');
      
      if (!stagesResponse.data.success) {
        console.error('Erro ao buscar etapas do funil:', stagesResponse.data.error);
        return;
      }
      
      const funnelStages = stagesResponse.data.data || [];
      console.log(`Encontradas ${funnelStages.length} etapas do funil`);
      
      // 2. Para cada etapa, buscar os passos associados
      const allSteps = [];
      
      for (const stage of funnelStages) {
        try {
          const stepsResponse = await axios.get(`/api/follow-up/funnel-steps?stageId=${stage.id}`);
          
          if (stepsResponse.data.success) {
            const steps = stepsResponse.data.data || [];
            
            // Mapear os passos para o formato esperado pelo componente FollowUpDetailModal
            const formattedSteps = steps.map((step: any) => ({
              id: step.id,
              etapa: stage.name, // Nome da etapa do funil
              tempo_de_espera: step.wait_time,
              template_name: step.template_name,
              message: step.message_content,
              stage_id: stage.id,
              stage_name: stage.name,
              stage_order: stage.order
            }));
            
            allSteps.push(...formattedSteps);
            console.log(`Adicionados ${formattedSteps.length} estágios para a etapa "${stage.name}"`);
          }
        } catch (error) {
          console.error(`Erro ao buscar estágios para a etapa ${stage.name}:`, error);
        }
      }
      
      console.log(`Total de ${allSteps.length} estágios encontrados para todas as etapas`);
      
      // 3. Se não foram encontrados passos no banco de dados, buscar dados da campanha
      if (allSteps.length === 0) {
        console.log('Nenhum estágio encontrado no banco de dados, buscando dados da campanha');
        
        try {
          const campaignResponse = await axios.get(`/api/follow-up/campaigns/${campaignId}`);
          
          if (campaignResponse.data.success && campaignResponse.data.data) {
            let campaignSteps = [];
            
            // Converter steps de string para objeto se necessário
            if (typeof campaignResponse.data.data.steps === 'string') {
              try {
                campaignSteps = JSON.parse(campaignResponse.data.data.steps);
              } catch (e) {
                console.error('Erro ao analisar steps da campanha:', e);
              }
            } else if (Array.isArray(campaignResponse.data.data.steps)) {
              campaignSteps = campaignResponse.data.data.steps;
            }
            
            // Mapear para o formato esperado
            const formattedCampaignSteps = campaignSteps.map((step: any, index: number) => {
              if (step.stage_name) {
                return {
                  id: `campaign-step-${index}`,
                  etapa: step.stage_name,
                  tempo_de_espera: step.wait_time || '',
                  template_name: step.template_name || '',
                  message: step.message || '',
                  stage_name: step.stage_name
                };
              } else if (step.etapa) {
                return {
                  id: `campaign-step-${index}`,
                  etapa: step.etapa,
                  tempo_de_espera: step.tempo_de_espera || '',
                  template_name: step.nome_template || '',
                  message: step.mensagem || '',
                  stage_name: step.etapa
                };
              }
              return null;
            }).filter(Boolean);
            
            if (formattedCampaignSteps.length > 0) {
              console.log(`Adicionados ${formattedCampaignSteps.length} passos da própria campanha`);
              allSteps.push(...formattedCampaignSteps);
            }
          }
        } catch (campaignError) {
          console.error('Erro ao buscar dados da campanha:', campaignError);
        }
      }
      
      setCampaignSteps(allSteps);
      
    } catch (err) {
      console.error('Erro ao buscar etapas e estágios do funil:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar dados ao carregar a página e quando a tab muda
  useEffect(() => {
    fetchFollowUps();
    fetchCampaigns();
  }, [activeTab]);
  
  // Quando um follow-up é selecionado, buscar as etapas da campanha
  useEffect(() => {
    if (selectedFollowUp) {
      fetchCampaignSteps(selectedFollowUp.campaign_id);
    }
  }, [selectedFollowUp]);

  // Filtrar follow-ups pelo termo de busca
  const filteredFollowUps = followUps.filter(followUp => 
    followUp.client_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para cancelar um follow-up
  const handleCancelFollowUp = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar este follow-up?')) {
      return;
    }

    try {
      setIsLoading(true);
      await axios.post('/api/follow-up/cancel', { followUpId: id });
      fetchFollowUps();
      if (selectedFollowUp?.id === id) {
        setSelectedFollowUp(null);
      }
    } catch (err: any) {
      console.error('Erro ao cancelar follow-up:', err);
      setError('Falha ao cancelar follow-up');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para remover um cliente
  const handleRemoveClient = async (clientId: string) => {
    if (!confirm(`Tem certeza que deseja remover todos os follow-ups do cliente "${clientId}"?`)) {
      return;
    }

    try {
      setIsLoading(true);
      await axios.post('/api/follow-up/remove-client', { clientId });
      fetchFollowUps();
      if (selectedFollowUp?.client_id === clientId) {
        setSelectedFollowUp(null);
      }
    } catch (err: any) {
      console.error('Erro ao remover cliente:', err);
      setError('Falha ao remover cliente');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para criar um novo follow-up
  const handleCreateFollowUp = async (clientId: string, campaignId: string) => {
    if (!clientId || !campaignId) {
      setError('Cliente e campanha são obrigatórios');
      return;
    }

    try {
      setIsLoading(true);
      await axios.post('/api/follow-up', {
        clientId,
        campaignId
      });
      setShowNewForm(false);
      fetchFollowUps();
    } catch (err: any) {
      console.error('Erro ao criar follow-up:', err);
      setError(err.response?.data?.error || 'Falha ao criar follow-up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <MainNavigation />
      
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Lista de Follow-ups</h1>

            <ErrorMessage 
              message={error} 
              onDismiss={() => setError(null)} 
            />

            <ActionBar 
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchTerm={searchTerm}
              onSearch={setSearchTerm}
              showNewForm={showNewForm}
              onToggleForm={() => setShowNewForm(!showNewForm)}
            />

            {showNewForm && (
              <NewFollowUpForm 
                campaigns={campaigns}
                isLoading={isLoading}
                onSubmit={handleCreateFollowUp}
              />
            )}

            <div className="bg-gray-700 rounded-lg">
              <FollowUpTable 
                followUps={filteredFollowUps}
                isLoading={isLoading}
                activeTab={activeTab}
                searchTerm={searchTerm}
                onSelect={setSelectedFollowUp}
                onCancel={handleCancelFollowUp}
                onRemoveClient={handleRemoveClient}
              />
            </div>

            {selectedFollowUp && (
              <FollowUpDetailModal 
                followUp={selectedFollowUp}
                campaignSteps={campaignSteps}
                onClose={() => setSelectedFollowUp(null)}
                onCancel={handleCancelFollowUp}
                onRemoveClient={handleRemoveClient}
                isLoading={isLoading}
              />
            )}

        </div>
      </div>
      
      <Footer />
    </div>
  );
}