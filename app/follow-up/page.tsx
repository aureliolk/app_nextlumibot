'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

// Tipos
interface FollowUpCampaign {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  active: boolean;
  stepsCount: number;
  activeFollowUps: number;
}

interface FollowUp {
  id: string;
  campaign_id: string;
  client_id: string;
  current_step: number;
  status: string;
  started_at: string;
  next_message_at: string | null;
  completed_at: string | null;
  is_responsive: boolean;
  campaign: {
    name: string;
  };
  messages: FollowUpMessage[];
}

interface FollowUpMessage {
  id: string;
  follow_up_id: string;
  step: number;
  content: string;
  sent_at: string;
  delivered: boolean;
  delivered_at: string | null;
}

// Componente principal da página
export default function FollowUpPage() {
  // Estados
  const [campaigns, setCampaigns] = useState<FollowUpCampaign[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'paused', 'completed', 'canceled'
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newClientId, setNewClientId] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');

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

  // Buscar dados ao carregar a página e quando a tab muda
  useEffect(() => {
    fetchFollowUps();
    fetchCampaigns();
  }, [activeTab]);

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
  const handleCreateFollowUp = async () => {
    if (!newClientId || !selectedCampaignId) {
      setError('Cliente e campanha são obrigatórios');
      return;
    }

    try {
      setIsLoading(true);
      await axios.post('/api/follow-up', {
        clientId: newClientId,
        campaignId: selectedCampaignId
      });
      setNewClientId('');
      setSelectedCampaignId('');
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
            <h1 className="text-3xl font-semibold text-center mb-8 text-white">
              Gerenciador de Follow-up
            </h1>

            {/* Mensagem de erro */}
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded mb-4">
                {error}
                <button 
                  className="float-right" 
                  onClick={() => setError(null)}
                >
                  &times;
                </button>
              </div>
            )}

            {/* Barra de ações */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    activeTab === 'active' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Ativos
                </button>
                <button
                  onClick={() => setActiveTab('paused')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    activeTab === 'paused' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Pausados
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    activeTab === 'completed' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Concluídos
                </button>
                <button
                  onClick={() => setActiveTab('canceled')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    activeTab === 'canceled' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Cancelados
                </button>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1 bg-gray-700 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={() => setShowNewForm(!showNewForm)}
                  className="px-3 py-1 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 transition-colors"
                >
                  {showNewForm ? 'Cancelar' : 'Novo Follow-up'}
                </button>
              </div>
            </div>

            {/* Formulário para novo follow-up */}
            {showNewForm && (
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-medium text-white mb-4">Novo Follow-up</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      ID do Cliente
                    </label>
                    <input
                      type="text"
                      value={newClientId}
                      onChange={(e) => setNewClientId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 text-white rounded-md"
                      placeholder="Ex: cliente123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Campanha
                    </label>
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 text-white rounded-md"
                    >
                      <option value="">Selecione uma campanha</option>
                      {campaigns.map(campaign => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleCreateFollowUp}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Criando...' : 'Criar Follow-up'}
                  </button>
                </div>
              </div>
            )}

            {/* Lista de follow-ups */}
            <div className="bg-gray-700 rounded-lg">
              {isLoading ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mb-2"></div>
                  <p>Carregando follow-ups...</p>
                </div>
              ) : filteredFollowUps.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  {searchTerm 
                    ? `Nenhum follow-up encontrado para "${searchTerm}"` 
                    : activeTab === 'active'
                    ? 'Não há follow-ups ativos no momento'
                    : activeTab === 'paused'
                    ? 'Não há follow-ups pausados no momento'
                    : activeTab === 'completed'
                    ? 'Não há follow-ups concluídos'
                    : 'Não há follow-ups cancelados'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-600">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Campanha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Etapa</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {filteredFollowUps.map((followUp) => (
                        <tr 
                          key={followUp.id} 
                          className="hover:bg-gray-650 cursor-pointer"
                          onClick={() => setSelectedFollowUp(followUp)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {followUp.client_id}
                            {followUp.is_responsive && (
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-700 text-white">
                                Responsivo
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {followUp.campaign.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {followUp.current_step}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              followUp.status === 'active' ? 'bg-green-500 text-white' :
                              followUp.status === 'paused' ? 'bg-yellow-500 text-white' :
                              followUp.status === 'completed' ? 'bg-blue-500 text-white' :
                              'bg-red-500 text-white'
                            }`}>
                              {followUp.status === 'active' ? 'Ativo' : 
                               followUp.status === 'paused' ? 'Pausado' : 
                               followUp.status === 'completed' ? 'Concluído' : 'Cancelado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {followUp.status === 'active' && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelFollowUp(followUp.id);
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  Cancelar
                                </button>
                              )}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveClient(followUp.client_id);
                                }}
                                className="text-gray-400 hover:text-gray-300"
                              >
                                Remover Cliente
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal de detalhes do follow-up */}
            {selectedFollowUp && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-semibold text-white">
                        Detalhes do Follow-up
                      </h2>
                      <button 
                        onClick={() => setSelectedFollowUp(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        &times;
                      </button>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-300">
                        <span className="font-medium text-white">Cliente:</span> {selectedFollowUp.client_id}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium text-white">Campanha:</span> {selectedFollowUp.campaign.name}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium text-white">Etapa Atual:</span> {selectedFollowUp.current_step}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium text-white">Status:</span> {selectedFollowUp.status}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium text-white">Responsivo:</span> {selectedFollowUp.is_responsive ? 'Sim' : 'Não'}
                      </p>
                    </div>

                    {selectedFollowUp.messages && selectedFollowUp.messages.length > 0 ? (
                      <div>
                        <h3 className="text-lg font-medium text-white mb-2">Mensagens</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {selectedFollowUp.messages.map((message) => (
                            <div key={message.id} className="bg-gray-700 p-3 rounded-lg">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-white">Etapa {message.step}</span>
                                <span className="text-xs text-gray-400">
                                  {new Date(message.sent_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm mt-1">{message.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center">Nenhuma mensagem enviada</p>
                    )}

                    <div className="mt-6 flex justify-end">
                      {selectedFollowUp.status === 'active' && (
                        <button
                          onClick={() => handleCancelFollowUp(selectedFollowUp.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors mr-2"
                        >
                          Cancelar Follow-up
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedFollowUp(null)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rodapé */}
            <div className="mt-8 text-xs text-center text-gray-400">
              &copy; <a href="https://lumibot.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-white">Lumibot</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}