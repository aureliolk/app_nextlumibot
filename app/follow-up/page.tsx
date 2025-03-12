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
      setCampaigns(response.data.data || []);
    } catch (err: any) {
      console.error('Erro ao carregar campanhas:', err);
    }
  };

  // Função para buscar as etapas da campanha
  const fetchCampaignSteps = async (campaignId: string) => {
    try {
      const response = await axios.get(`/api/follow-up/campaigns/${campaignId}`);
      if (response.data.success && response.data.data) {
        // Verificar se steps é uma string ou já é um objeto
        const stepsData = response.data.data.steps;
        let parsedSteps = [];
        
        if (typeof stepsData === 'string') {
          try {
            parsedSteps = JSON.parse(stepsData);
          } catch (e) {
            console.error('Erro ao analisar steps:', e);
            parsedSteps = [];
          }
        } else if (Array.isArray(stepsData)) {
          parsedSteps = stepsData;
        } else if (typeof stepsData === 'object') {
          parsedSteps = [stepsData];
        }
        
        // Para debug: mostrar quantas etapas foram carregadas
        console.log(`Carregadas ${parsedSteps.length} etapas/estágios da campanha`);
        
        // Temporariamente, vamos carregar dados reais do CSV como fallback para demonstração
        if (parsedSteps.length < 3) {
          console.log('Poucos estágios encontrados, carregando dados de exemplo do CSV para demonstração');
          
          // Dados de exemplo baseados no CSV para teste da UI
          const dadosExemplo = [
            { 
              etapa: "New - Aguardando Resposta (IA)",
              tempo_de_espera: "10 minutos",
              template_name: "novo_lead_10min",
              message: "Ei, Boss! 🚀 Vi que você recebeu a mensagem, mas ainda não respondeu. Quer tirar alguma dúvida antes de começarmos?"
            },
            { 
              etapa: "New - Aguardando Resposta (IA)",
              tempo_de_espera: "30 minutos",
              template_name: "novo_lead_30min",
              message: "Oi! Percebi que seu atendimento ainda está em andamento. Sei que a rotina pode ser corrida, então estou por aqui caso precise retomar a conversa ou tirar alguma dúvida!"
            },
            { 
              etapa: "New - Aguardando Resposta (IA)",
              tempo_de_espera: "1 hora",
              template_name: "novo_lead_1h",
              message: "Olá! Você iniciou um contato conosco recentemente e queremos garantir que você receba todas as informações possíveis. Caso precise de suporte ou tenha dúvidas sobre seu atendimento, estou por aqui."
            },
            { 
              etapa: "New - Aguardando Resposta (IA)",
              tempo_de_espera: "24 horas",
              template_name: "novo_lead_24h",
              message: "Ei, Boss! Vi que você ainda não respondeu... Tá tudo certo por aí? Se tiver dúvidas, me avisa! Estou aqui para te ajudar."
            },
            { 
              etapa: "New - Aguardando Resposta (IA)",
              tempo_de_espera: "48 horas",
              template_name: "novo_lead_48h",
              message: "Oi! Notamos que sua conversa conosco ainda está aberta. Caso precise de mais informações, você pode acessar os detalhes aqui: https://bit.ly/conteudoparalojas_inteligente"
            },
            { 
              etapa: "Conexão - Lead Engajado - Em Qualificação (IA)",
              tempo_de_espera: "10 minutos",
              template_name: "qualificacao_10min",
              message: "Oi! Vi que você iniciou um processo conosco, mas ainda não concluímos sua qualificação. Caso precise de mais informações ou queira continuar, estou à disposição para te ajudar!"
            },
            { 
              etapa: "Conexão - Lead Engajado - Em Qualificação (IA)",
              tempo_de_espera: "1 hora",
              template_name: "qualificacao_1h",
              message: "Boss! Para te ajudar com mais informações, preparamos um vídeo explicativo sobre como funciona. Você pode assistir aqui: https://www.youtube.com/watch?v=XXcaQZY0udI&t=1s"
            },
            { 
              etapa: "Qualificado IA",
              tempo_de_espera: "1 hora",
              template_name: "qualificado_1h",
              message: "Ótimo! Já temos todas as informações necessárias para prosseguir. Nosso especialista entrará em contato em breve para discutir as próximas etapas."
            },
            { 
              etapa: "Fechamento (IA)",
              tempo_de_espera: "24 horas",
              template_name: "fechamento_24h",
              message: "Estamos finalizando os detalhes do seu caso. Tem alguma dúvida de última hora antes de concluirmos?"
            }
          ];
          
          // Mesclar os dados existentes com os dados de exemplo
          if (parsedSteps.length > 0) {
            // Se já existem alguns dados, apenas complementamos
            parsedSteps = [...parsedSteps, ...dadosExemplo.filter(d => 
              !parsedSteps.some(p => 
                p.template_name === d.template_name && p.etapa === d.etapa
              )
            )];
          } else {
            // Se não há dados, usamos os exemplos
            parsedSteps = dadosExemplo;
          }
          
          console.log(`Agora temos ${parsedSteps.length} etapas/estágios para visualização`);
        }
        
        setCampaignSteps(parsedSteps);
      }
    } catch (err) {
      console.error('Erro ao buscar etapas da campanha:', err);
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

            <FollowUpDetailModal 
              followUp={selectedFollowUp}
              campaignSteps={campaignSteps}
              onClose={() => setSelectedFollowUp(null)}
              onCancel={handleCancelFollowUp}
              onRemoveClient={handleRemoveClient}
            />

        </div>
      </div>
      
      <Footer />
    </div>
  );
}