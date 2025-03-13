'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { ErrorMessage, Footer } from '../../_components';
import MainNavigation from '../../_components/MainNavigation';
import { CampaignForm } from '../../_components';
import Link from 'next/link';

// Componente para painel de etapas/estágios
interface StageTabProps {
  campaignId: string;
  onRefresh: () => void;
}

const StageTab: React.FC<StageTabProps> = ({ campaignId, onRefresh }) => {
  const [stages, setStages] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);
  
  // Formulário para novo passo
  const [formData, setFormData] = useState({
    name: '',
    template_name: '',
    wait_time: '30 minutos',
    message_content: '',
    message_category: 'Utility',
    auto_respond: true
  });
  
  // Buscar estágios e passos
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar estágios do funil
      const stagesRes = await axios.get('/api/follow-up/funnel-stages');
      if (stagesRes.data.success) {
        setStages(stagesRes.data.data);
        
        // Se há estágios e nenhum está selecionado, selecionar o primeiro
        if (stagesRes.data.data.length > 0 && !selectedStage) {
          setSelectedStage(stagesRes.data.data[0].id);
        }
      }
      
      // Se um estágio estiver selecionado, buscar seus passos
      if (selectedStage) {
        const stepsRes = await axios.get(`/api/follow-up/funnel-steps?stageId=${selectedStage}`);
        if (stepsRes.data.success) {
          setSteps(stepsRes.data.data);
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar dados quando o componente montar ou o estágio selecionado mudar
  useEffect(() => {
    fetchData();
  }, [selectedStage]);
  
  // Função para adicionar um novo passo ao estágio
  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStage) {
      setError("Nenhum estágio selecionado");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const payload = {
        funnel_stage_id: selectedStage,
        name: formData.name,
        template_name: formData.template_name,
        wait_time: formData.wait_time,
        message_content: formData.message_content,
        message_category: formData.message_category,
        auto_respond: formData.auto_respond
      };
      
      const response = await axios.post('/api/follow-up/funnel-steps', payload);
      
      if (response.data.success) {
        // Limpar o formulário
        setFormData({
          name: '',
          template_name: '',
          wait_time: '30 minutos',
          message_content: '',
          message_category: 'Utility',
          auto_respond: true
        });
        
        // Recarregar os passos
        fetchData();
        onRefresh();
        setIsAddingStep(false);
      }
    } catch (err: any) {
      console.error('Erro ao adicionar passo:', err);
      setError(err.response?.data?.error || 'Erro ao adicionar passo');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Etapas e Estágios do Funil
      </h2>
      
      {error && <ErrorMessage message={error} onClose={() => setError(null)} className="mb-4" />}
      
      {/* Seleção de estágio do funil */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Estágios do Funil</h3>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {stages.map(stage => (
            <button
              key={stage.id}
              onClick={() => setSelectedStage(stage.id)}
              className={`px-3 py-2 rounded-md ${
                selectedStage === stage.id 
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {stage.name}
            </button>
          ))}
        </div>
        
        {selectedStage && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">
                Estágios em {stages.find(s => s.id === selectedStage)?.name}
              </h3>
              
              <button
                onClick={() => setIsAddingStep(!isAddingStep)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                {isAddingStep ? 'Cancelar' : 'Adicionar Estágio'}
              </button>
            </div>
            
            {isAddingStep && (
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <h4 className="text-md font-medium text-white mb-3">Novo Estágio</h4>
                
                <form onSubmit={handleAddStep} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Nome do Estágio *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded-md border border-gray-500"
                        placeholder="Ex: Primeiro contato"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Nome do Template *
                      </label>
                      <input
                        type="text"
                        value={formData.template_name}
                        onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded-md border border-gray-500"
                        placeholder="Ex: primeiro_contato_10min"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Tempo de Espera *
                      </label>
                      <input
                        type="text"
                        value={formData.wait_time}
                        onChange={(e) => setFormData({...formData, wait_time: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded-md border border-gray-500"
                        placeholder="Ex: 10 minutos, 1 hora, 1 dia"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Categoria
                      </label>
                      <select
                        value={formData.message_category}
                        onChange={(e) => setFormData({...formData, message_category: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded-md border border-gray-500"
                      >
                        <option value="Utility">Utilitário</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Onboarding">Onboarding</option>
                        <option value="Support">Suporte</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Conteúdo da Mensagem *
                    </label>
                    <textarea
                      value={formData.message_content}
                      onChange={(e) => setFormData({...formData, message_content: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-600 text-white rounded-md border border-gray-500"
                      placeholder="Digite o conteúdo da mensagem..."
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto-respond"
                      checked={formData.auto_respond}
                      onChange={(e) => setFormData({...formData, auto_respond: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="auto-respond" className="text-sm text-gray-300">
                      Resposta automática
                    </label>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      {isLoading ? 'Salvando...' : 'Salvar Estágio'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Lista de estágios */}
            {steps.length > 0 ? (
              <div className="bg-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-600">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Nome</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Template</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Tempo</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Mensagem</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {steps.map((step) => (
                      <tr key={step.id} className="hover:bg-gray-600/30">
                        <td className="px-4 py-2 text-sm text-white">{step.name}</td>
                        <td className="px-4 py-2 text-sm text-purple-400">{step.template_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{step.wait_time}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">
                          <div className="max-w-xs truncate">
                            {step.message_content.substring(0, 50)}
                            {step.message_content.length > 50 ? '...' : ''}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-300">
                          <button
                            className="text-blue-400 hover:text-blue-300 mr-2"
                            onClick={() => alert('Editar estágio (a implementar)')}
                          >
                            Editar
                          </button>
                          <button
                            className="text-red-400 hover:text-red-300"
                            onClick={() => alert('Remover estágio (a implementar)')}
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <p className="text-gray-400">
                  {isLoading 
                    ? 'Carregando estágios...' 
                    : 'Nenhum estágio encontrado para este estágio do funil.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

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
              <StageTab 
                campaignId={campaignId} 
                onRefresh={fetchData}
              />
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