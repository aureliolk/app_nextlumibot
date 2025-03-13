// app/follow-up/campaigns/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ErrorMessage, Footer } from '../../_components';
import MainNavigation from '../../_components/MainNavigation';
import { CampaignForm } from '../../_components';
import Link from 'next/link';
import followUpService from '../../_services/followUpService';
import { Campaign, CampaignStep, FunnelStage } from '../../_types';

// Componente principal de edição de campanha
export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignSteps, setCampaignSteps] = useState<CampaignStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSteps, setIsLoadingSteps] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  
  // Buscar todos os dados necessários com uma única função
  const fetchAllData = async () => {
    setIsLoading(true);
    setIsLoadingSteps(true);
    
    try {
      // Executar chamadas em paralelo para maior eficiência
      console.log('Iniciando carregamento de dados');
      
      const [campaignData, stages, steps] = await Promise.all([
        followUpService.getCampaign(campaignId),
        followUpService.getFunnelStages(),
        followUpService.getCampaignSteps(campaignId)
      ]);
      
      console.log(`Dados carregados: campanha, ${stages.length} estágios, ${steps.length} passos`);
      
      setCampaign(campaignData);
      setFunnelStages(stages);
      setCampaignSteps(steps);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
      setIsLoadingSteps(false);
    }
  };
  
  // Efeito para carregar todos os dados de uma só vez
  useEffect(() => {
    fetchAllData();
  }, [campaignId]);
  
  // Função para atualizar a campanha
  const handleUpdateCampaign = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // Usar axios diretamente aqui pois o serviço ainda não tem esta funcionalidade
      const response = await followUpService.updateCampaign(campaignId, formData);
      
      // Atualizar todos os dados de uma vez após o salvamento
      fetchAllData();
      
      alert('Campanha atualizada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao atualizar campanha:', err);
      setError(err.message || 'Erro ao atualizar campanha');
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
            {/* Removemos as abas de navegação, já que o formulário agora contém as etapas integradas */}
            
            {/* CampaignForm único para toda a edição */}
            <CampaignForm
              funnelStages={funnelStages}
              initialData={{
                ...campaign,
                // Incluímos todos os passos carregados do servidor para esta campanha
                steps: campaignSteps.length > 0 
                  ? campaignSteps.map(step => ({
                      id: step.id,
                      stage_id: step.stage_id || '',
                      stage_name: step.etapa || step.stage_name || '',
                      template_name: step.template_name || '',
                      wait_time: step.tempo_de_espera || step.wait_time || '',
                      message: step.message || step.mensagem || '',
                      auto_respond: true
                    }))
                  : campaign?.steps || []
              }}
              onSubmit={handleUpdateCampaign}
              onCancel={() => router.push('/follow-up/campaigns')}
              isLoading={isSubmitting || isLoadingSteps}
            />
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