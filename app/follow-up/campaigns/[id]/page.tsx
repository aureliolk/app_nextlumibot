// app/follow-up/campaigns/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { ErrorMessage, Footer, FollowUpDetailModal } from '../../_components';
import MainNavigation from '../../_components/MainNavigation';
import { CampaignForm } from '../../_components';
import Link from 'next/link';

// Removido o componente StageTab, usando FollowUpDetailModal em seu lugar

// Componente principal de edição de campanha
export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [funnelStages, setFunnelStages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'stages'>('general');
  
  // Buscar dados da campanha e estágios do funil
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar detalhes da campanha
      const campaignRes = await axios.get(`/api/follow-up/campaigns/${campaignId}`);
      if (campaignRes.data.success) {
        const campaignData = campaignRes.data.data;
        
        // Processar os steps se estiverem em formato string
        let steps = [];
        if (typeof campaignData.steps === 'string') {
          try {
            steps = JSON.parse(campaignData.steps);
          } catch (e) {
            console.error('Erro ao analisar steps:', e);
            steps = [];
          }
        } else {
          steps = campaignData.steps;
        }
        
        setCampaign({
          ...campaignData,
          steps
        });
      }
      
      // Buscar estágios do funil
      const stagesRes = await axios.get('/api/follow-up/funnel-stages');
      if (stagesRes.data.success) {
        setFunnelStages(stagesRes.data.data);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [campaignId]);
  
  // Função para atualizar a campanha
  const handleUpdateCampaign = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const response = await axios.put(`/api/follow-up/campaigns/${campaignId}`, formData);
      if (response.data.success) {
        // Atualizar dados locais
        fetchData();
        alert('Campanha atualizada com sucesso!');
      }
    } catch (err: any) {
      console.error('Erro ao atualizar campanha:', err);
      setError(err.response?.data?.error || 'Erro ao atualizar campanha');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <MainNavigation />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Link 
            href="/follow-up/campaigns"
            className="text-gray-400 hover:text-white mr-2"
          >
            ← Voltar para Campanhas
          </Link>
          <h1 className="text-2xl font-bold">
            {isLoading ? 'Carregando...' : `Editar Campanha: ${campaign?.name}`}
          </h1>
        </div>
        
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : campaign ? (
          <>
            {/* Abas de navegação */}
            <div className="flex mb-4 border-b border-gray-700">
              <button
                className={`px-4 py-2 ${activeTab === 'general' 
                  ? 'border-b-2 border-orange-500 text-orange-500' 
                  : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('general')}
              >
                Informações Gerais
              </button>
              <button
                className={`px-4 py-2 ${activeTab === 'stages' 
                  ? 'border-b-2 border-orange-500 text-orange-500' 
                  : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('stages')}
              >
                Etapas e Estágios
              </button>
            </div>
            
            {/* Conteúdo da aba */}
            {activeTab === 'general' ? (
              <CampaignForm
                funnelStages={funnelStages}
                initialData={campaign}
                onSubmit={handleUpdateCampaign}
                onCancel={() => router.push('/follow-up/campaigns')}
                isLoading={isSubmitting}
              />
            ) : (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Visualização e Gerenciamento das Etapas do Funil</h3>
                {campaign ? (
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <FollowUpDetailModal 
                      followUp={{
                        ...campaign,
                        id: campaignId,
                        client_id: 'Preview', // Mock data for preview
                        campaign: { 
                          id: campaignId, 
                          name: campaign.name 
                        },
                        campaign_id: campaignId,
                        current_step: 0,
                        current_stage_id: campaign.default_stage_id || '',
                        current_stage_name: funnelStages.find(s => s.id === campaign.default_stage_id)?.name || 'Inicial',
                        status: 'preview',
                        is_responsive: false,
                        started_at: new Date().toISOString(),
                        next_message_at: null,
                        completed_at: null,
                        messages: [],
                      }}
                      campaignId={campaignId}
                      onClose={() => {}} // No-op since this is embedded view
                      onCancel={() => {}} // No-op for preview
                    />
                    
                    <div className="p-4 border-t border-gray-700">
                      <button
                        onClick={() => alert('Adicionar novo estágio (a implementar)')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Adicionar Novo Estágio
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <p className="text-gray-400">Carregando dados da campanha...</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="text-gray-400 text-center">
              Campanha não encontrada ou foi removida.
            </p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}