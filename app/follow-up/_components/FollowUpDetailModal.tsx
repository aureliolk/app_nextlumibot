// app/follow-up/_components/FollowUpDetailModal.tsx
'use client';

import React from 'react';
import { FollowUp } from './FollowUpTable';

interface FollowUpDetailModalProps {
  followUp: FollowUp | null;
  campaignSteps: any[];
  onClose: () => void;
  onCancel: (id: string) => void;
}

export const FollowUpDetailModal: React.FC<FollowUpDetailModalProps> = ({
  followUp,
  campaignSteps,
  onClose,
  onCancel
}) => {
  if (!followUp) return null;

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
          
          <div className="mb-4">
            <p className="text-gray-300">
              <span className="font-medium text-white">Cliente:</span> {followUp.client_id}
            </p>
            <p className="text-gray-300">
              <span className="font-medium text-white">Campanha:</span> {followUp.campaign.name}
            </p>
            <p className="text-gray-300">
              <span className="font-medium text-white">Etapa Atual:</span> {followUp.current_step}
            </p>
            <p className="text-gray-300">
              <span className="font-medium text-white">Status:</span> {followUp.status}
            </p>
            <p className="text-gray-300">
              <span className="font-medium text-white">Responsivo:</span> {followUp.is_responsive ? 'Sim' : 'Não'}
            </p>
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Mensagem</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Tempo de Espera</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {campaignSteps.map((step, index) => (
                        <tr key={index} className={index === followUp.current_step ? 'bg-orange-900/30' : ''}>
                          <td className="px-4 py-2 text-sm text-white">{index}</td>
                          <td className="px-4 py-2 text-sm text-gray-300">
                            {step.mensagem?.substring(0, 50)}
                            {step.mensagem?.length > 50 ? '...' : ''}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-300">{step.tempo_de_espera}</td>
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
              <h3 className="text-lg font-medium text-white mb-2">Mensagens</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {followUp.messages.map((message) => (
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
            <p className="text-gray-400 text-center mt-4">Nenhuma mensagem enviada</p>
          )}

          <div className="mt-6 flex justify-end">
            {followUp.status === 'active' && (
              <button
                onClick={() => onCancel(followUp.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors mr-2"
              >
                Cancelar Follow-up
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