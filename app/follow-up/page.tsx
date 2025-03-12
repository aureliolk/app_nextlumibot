// app/follow-up/page.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

// Importando os componentes
import {
  Header,
  ErrorMessage,
  ActionBar,
  NewFollowUpForm,
  FollowUpTable,
  FollowUpDetailModal,
  Footer
} from './_components';

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
      if (response.data.success) {
        setCampaignSteps(JSON.parse(response.data.steps || '[]'));
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
    <div className="min-h-screen bg-gray-900 py-6 flex flex-col justify-center sm:py-12">
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <Header title="Gerenciador de Follow-up" />

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
            />

            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}