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
}

export const FollowUpDetailModal: React.FC<FollowUpDetailModalProps> = ({
  followUp,
  campaignSteps,
  onClose,
  onCancel,
  onResume,
  onAdvance,
  onRemoveClient
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

          {/* Etapas da Campanha */}
          <div className="mt-4">
            <h3 className="text-lg font-medium text-white mb-2">Etapas da Campanha</h3>
            {campaignSteps.length > 0 ? (
              <div className="bg-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-600">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Etapa</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Estágio do Funil</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Mensagem</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Tempo de Espera</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {campaignSteps.map((step, index) => (
                        <tr key={index} className={index === followUp.current_step ? 'bg-orange-900/30' : ''}>
                          <td className="px-4 py-2 text-sm text-white">{index + 1}</td>
                          <td className="px-4 py-2 text-sm text-orange-400">{step.stage_name || 'Não definido'}</td>
                          <td className="px-4 py-2 text-sm text-gray-300">
                            {step.mensagem?.substring(0, 50) || step.message?.substring(0, 50)}
                            {(step.mensagem?.length > 50 || step.message?.length > 50) ? '...' : ''}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-300">{step.tempo_de_espera || step.wait_time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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