// app/follow-up/_components/FollowUpDetailModal.tsx
'use client';

import React, { useMemo } from 'react';
import { FollowUp } from './FollowUpTable';

interface FollowUpDetailModalProps {
  followUp: FollowUp | null;
  campaignSteps: any[];
  onClose: () => void;
  onCancel: (id: string) => void;
  onResume?: (id: string) => void;
  onAdvance?: (id: string) => void;
  onRemoveClient?: (id: string) => void;
  isLoading?: boolean;
}

export const FollowUpDetailModal: React.FC<FollowUpDetailModalProps> = ({
  followUp,
  campaignSteps,
  onClose,
  onCancel,
  onResume,
  onAdvance,
  onRemoveClient,
  isLoading = false
}) => {
  if (!followUp) return null;

  // Agrupar mensagens por estágio do funil
  const messagesByStage = useMemo(() => {
    if (!followUp.messages) return {};
    
    const grouped: Record<string, typeof followUp.messages> = {};
    
    followUp.messages.forEach(message => {
      const stage = message.funnel_stage || 'Sem estágio';
      if (!grouped[stage]) {
        grouped[stage] = [];
      }
      grouped[stage].push(message);
    });
    
    return grouped;
  }, [followUp.messages]);

  // Ordenar os estágios na ordem correta
  const sortedStages = useMemo(() => {
    return Object.keys(messagesByStage).sort();
  }, [messagesByStage]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-[80vw] w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-white">
              Detalhes do Follow-up
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              &times;
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Informações Gerais</h3>
              <div className="bg-gray-700 p-4 rounded-md space-y-2">
                <p className="text-gray-300">
                  <span className="font-medium text-white">Cliente:</span> {followUp.client_id}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-white">Campanha:</span> {followUp.campaign.name}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-white">Etapa do Funil:</span>{' '}
                  <span className="text-orange-400 font-medium">
                    {followUp.current_stage_name || 'Não definido'}
                  </span>
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-white">Número da Etapa:</span> {followUp.current_step + 1}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-white">Status:</span>{' '}
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    followUp.status === 'active' ? 'bg-green-500 text-white' :
                    followUp.status === 'paused' ? 'bg-yellow-500 text-white' :
                    followUp.status === 'completed' ? 'bg-blue-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {followUp.status === 'active' ? 'Ativo' : 
                     followUp.status === 'paused' ? 'Pausado' : 
                     followUp.status === 'completed' ? 'Concluído' : 'Cancelado'}
                  </span>
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-white">Responsivo:</span>{' '}
                  {followUp.is_responsive ? 'Sim' : 'Não'}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Datas</h3>
              <div className="bg-gray-700 p-4 rounded-md space-y-2">
                <p className="text-gray-300">
                  <span className="font-medium text-white">Início:</span> {formatDate(followUp.started_at)}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-white">Próxima mensagem:</span> {formatDate(followUp.next_message_at)}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-white">Última atualização:</span> {formatDate(followUp.started_at)}
                </p>
                {followUp.completed_at && (
                  <p className="text-gray-300">
                    <span className="font-medium text-white">Concluído em:</span> {formatDate(followUp.completed_at)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Etapas do Funil e Estágios */}
          <div className="mt-4">
            <h3 className="text-lg font-medium text-white mb-2">Etapas e Estágios do Funil</h3>
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-400">Carregando estágios...</span>
              </div>
            ) : campaignSteps.length > 0 ? (
              <div className="bg-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  {/* Agrupar os estágios por etapa do funil */}
                  {(() => {
                    // Função para agrupar estágios por etapa do funil
                    const etapas: Record<string, typeof campaignSteps> = {};
                    
                    // Agrupar por etapa do funil
                    campaignSteps.forEach((step, index) => {
                      // Verificar todos os campos possíveis para o nome da etapa
                      const etapaFunil = step.etapa || step.stage_name || 'Sem etapa definida';
                      
                      if (!etapas[etapaFunil]) {
                        etapas[etapaFunil] = [];
                      }
                      
                      etapas[etapaFunil].push({...step, originalIndex: index});
                    });
                    
                    // Ordenar as etapas pela propriedade stage_order se disponível
                    // Caso contrário, usar uma ordem predefinida como fallback
                    const ordemEtapas = [
                      "New - Aguardando Resposta (IA)",
                      "Conexão - Lead Engajado - Em Qualificação (IA)",
                      "Qualificado IA",
                      "Fechamento (IA)",
                      "Carrinho Abandonado",
                      "Checkout"
                    ];
                    
                    // Ordenar as etapas conforme a ordem definida ou pelo stage_order
                    const etapasOrdenadas = Object.entries(etapas)
                      .sort(([etapaA, stepsA], [etapaB, stepsB]) => {
                        // Primeiro tentar ordenar pelo stage_order se disponível
                        const stepWithOrderA = stepsA.find(s => s.stage_order !== undefined);
                        const stepWithOrderB = stepsB.find(s => s.stage_order !== undefined);
                        
                        if (stepWithOrderA && stepWithOrderB) {
                          return stepWithOrderA.stage_order - stepWithOrderB.stage_order;
                        }
                        
                        // Fallback para a ordem predefinida se stage_order não estiver disponível
                        const indexA = ordemEtapas.indexOf(etapaA);
                        const indexB = ordemEtapas.indexOf(etapaB);
                        
                        // Se uma etapa não estiver na lista de ordem, colocá-la no final
                        if (indexA === -1 && indexB === -1) return 0;
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        
                        return indexA - indexB;
                      });
                    
                    // Renderizar cada etapa do funil com seus estágios
                    return etapasOrdenadas.map(([etapaFunil, estagios], etapaIndex) => {
                      // Ordenar os estágios pelo tempo de espera
                      const estagiosOrdenados = [...estagios].sort((a, b) => {
                        // Função para extrair minutos de um tempo como "10 minutos", "1 hora", etc.
                        const extrairMinutos = (tempo : any) => {
                          if (!tempo) return 0;
                          
                          const tempoStr = tempo.toLowerCase();
                          if (tempoStr.includes('minuto')) {
                            return parseInt(tempoStr.match(/\d+/)[0]);
                          } else if (tempoStr.includes('hora')) {
                            return parseInt(tempoStr.match(/\d+/)[0]) * 60;
                          } else if (tempoStr.includes('dia')) {
                            return parseInt(tempoStr.match(/\d+/)[0]) * 24 * 60;
                          }
                          return 0;
                        };
                        
                        const minutosA = extrairMinutos(a.tempo_de_espera || a.wait_time);
                        const minutosB = extrairMinutos(b.tempo_de_espera || b.wait_time);
                        
                        return minutosA - minutosB;
                      });
                      
                      return (
                        <div key={etapaIndex} className="mb-4">
                          {/* Cabeçalho da Etapa do Funil */}
                          <div className="px-4 py-3 bg-gray-800 border-l-4 border-orange-500">
                            <h4 className="text-md font-semibold text-orange-400">
                              Etapa {etapaIndex + 1}: {etapaFunil}
                            </h4>
                          </div>
                          
                          {/* Tabela de Estágios para esta Etapa */}
                          <table className="min-w-full divide-y divide-gray-600">
                            <thead className="bg-gray-800/50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Estágio</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Tempo de Espera</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Nome do Template</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Mensagem</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-600">
                              {estagiosOrdenados.map((step, estagioIndex) => {
                                const originalIndex = step.originalIndex as number;
                                const isCurrentStep = originalIndex === followUp.current_step;
                                
                                return (
                                  <tr 
                                    key={estagioIndex} 
                                    className={`${isCurrentStep ? 'bg-orange-900/30' : ''} hover:bg-gray-600/30`}
                                  >
                                    <td className="px-4 py-2 text-sm font-medium text-white">
                                      {isCurrentStep && (
                                        <span className="inline-block bg-orange-500 w-2 h-2 rounded-full mr-2"></span>
                                      )}
                                      {estagioIndex + 1}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-300">
                                      {step.tempo_de_espera || step.wait_time}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-purple-400">
                                      {step.template_name || 'Não definido'}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-300">
                                      <div className="max-w-md truncate">
                                        {step.mensagem?.substring(0, 60) || step.message?.substring(0, 60)}
                                        {(step.mensagem?.length > 60 || step.message?.length > 60) ? '...' : ''}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-center">Nenhuma etapa encontrada</p>
            )}
          </div>

          {followUp.messages && followUp.messages.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-white mb-2">Mensagens por Estágio do Funil</h3>
              
              <div className="space-y-4">
                {/* Primeiro mostrar mensagens do cliente */}
                {followUp.messages.some(m => m.step === -1) && (
                  <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                    <h4 className="text-sm font-medium text-purple-400">Mensagens do Cliente</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {followUp.messages
                        .filter(m => m.step === -1)
                        .map(message => (
                          <div key={message.id} className="bg-gray-600 p-3 rounded-lg">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-purple-400">Resposta do Cliente</span>
                              <span className="text-xs text-gray-400">
                                {formatDate(message.sent_at)}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm mt-1">{message.content}</p>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                {/* Depois mostrar mensagens agrupadas por estágio */}
                {sortedStages
                  .filter(stage => stage !== 'Sem estágio' || 
                    !messagesByStage[stage].every(m => m.step === -1)
                  )
                  .map(stage => (
                    <div key={stage} className="bg-gray-700 p-4 rounded-lg space-y-2">
                      <h4 className="text-sm font-medium text-orange-400">{stage}</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {messagesByStage[stage]
                          .filter(m => m.step !== -1)
                          .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
                          .map(message => (
                            <div key={message.id} className="bg-gray-600 p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-sm font-medium text-white">Etapa {message.step + 1}</span>
                                  {message.template_name && (
                                    <span className="ml-2 text-xs text-gray-400">
                                      {message.template_name}
                                    </span>
                                  )}
                                  {message.category && (
                                    <span className="ml-2 px-1 py-0.5 bg-gray-500 text-xs rounded">
                                      {message.category}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <span className="text-xs text-gray-400">
                                    {formatDate(message.sent_at)}
                                  </span>
                                  {message.delivered && (
                                    <span className="ml-2 text-green-400 text-xs">✓</span>
                                  )}
                                </div>
                              </div>
                              <p className="text-gray-300 text-sm mt-1">{message.content}</p>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center mt-4">Nenhuma mensagem enviada</p>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            {followUp.status === 'paused' && onResume && (
              <button 
                onClick={() => onResume(followUp.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Retomar
              </button>
            )}
            {followUp.status === 'active' && onAdvance && (
              <button 
                onClick={() => onAdvance(followUp.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Avançar para Próxima Etapa
              </button>
            )}
            {followUp.status === 'active' && (
              <button
                onClick={() => onCancel(followUp.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Cancelar Follow-up
              </button>
            )}
            {onRemoveClient && (
              <button
                onClick={() => onRemoveClient(followUp.client_id)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Remover Cliente
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};