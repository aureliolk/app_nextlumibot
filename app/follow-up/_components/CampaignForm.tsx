// app/follow-up/_components/CampaignForm.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface FunnelStage {
  id: string;
  name: string;
  order: number;
  description?: string;
}

interface Step {
  id?: string;
  stage_id: string;
  stage_name: string;
  template_name: string;
  wait_time: string;
  message: string;
  category?: string;
  auto_respond: boolean;
}

interface CampaignFormProps {
  funnelStages: FunnelStage[];
  initialData?: {
    id?: string;
    name: string;
    description?: string;
    steps: Step[];
  };
  onSubmit: (formData: {
    name: string;
    description: string;
    steps: Step[];
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  funnelStages,
  initialData,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [steps, setSteps] = useState<Step[]>(initialData?.steps || []);
  const [selectedStage, setSelectedStage] = useState<string>('');
  
  // Formulário para adicionar nova etapa
  const [newStep, setNewStep] = useState<Step>({
    stage_id: '',
    stage_name: '',
    template_name: '',
    wait_time: '30 minutos',
    message: '',
    category: 'Utility',
    auto_respond: true
  });
  
  // Atualizar o stage_name quando o stage_id muda
  useEffect(() => {
    if (newStep.stage_id) {
      const stage = funnelStages.find(s => s.id === newStep.stage_id);
      if (stage) {
        setNewStep(prev => ({
          ...prev,
          stage_name: stage.name
        }));
      }
    }
  }, [newStep.stage_id, funnelStages]);
  
  // Carregar estágios do funil ao iniciar
  useEffect(() => {
    const initForm = async () => {
      try {
        if (initialData?.steps && Array.isArray(initialData.steps)) {
          // Se já tiver etapas iniciais, mapear para o formato correto se necessário
          const formattedSteps = initialData.steps.map(step => {
            // Se o formato for { stage_name, wait_time, message, template_name }
            if (step.stage_name) {
              const stage = funnelStages.find(s => s.name === step.stage_name);
              return {
                stage_id: stage?.id || '',
                stage_name: step.stage_name,
                template_name: step.template_name || '',
                wait_time: step.wait_time || '',
                message: step.message || '',
                category: step.category || 'Utility',
                auto_respond: step.auto_respond !== undefined ? step.auto_respond : true
              };
            }
            // Se o formato for { etapa, mensagem, tempo_de_espera, nome_template }
            else if (step.etapa) {
              const stage = funnelStages.find(s => s.name === step.etapa);
              return {
                stage_id: stage?.id || '',
                stage_name: step.etapa,
                template_name: step.nome_template || '',
                wait_time: step.tempo_de_espera || '',
                message: step.mensagem || '',
                category: step.categoria || 'Utility',
                auto_respond: step.resposta_automatica === 'Sim'
              };
            }
            return step;
          });
          
          setSteps(formattedSteps);
        }
      } catch (error) {
        console.error('Erro ao inicializar formulário:', error);
      }
    };
    
    initForm();
  }, [initialData, funnelStages]);
  
  const handleAddStep = () => {
    if (!newStep.stage_id || !newStep.template_name || !newStep.wait_time || !newStep.message) {
      alert('Preencha todos os campos obrigatórios para adicionar uma etapa');
      return;
    }
    
    setSteps([...steps, { ...newStep }]);
    
    // Resetar o formulário mas manter o estágio selecionado
    setNewStep({
      stage_id: newStep.stage_id,
      stage_name: newStep.stage_name,
      template_name: '',
      wait_time: '30 minutos',
      message: '',
      category: 'Utility',
      auto_respond: true
    });
  };
  
  const handleRemoveStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };
  
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === steps.length - 1)) {
      return;
    }
    
    const newSteps = [...steps];
    const step = newSteps[index];
    
    if (direction === 'up') {
      newSteps[index] = newSteps[index - 1];
      newSteps[index - 1] = step;
    } else {
      newSteps[index] = newSteps[index + 1];
      newSteps[index + 1] = step;
    }
    
    setSteps(newSteps);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('O nome da campanha é obrigatório');
      return;
    }
    
    if (steps.length === 0) {
      alert('A campanha precisa ter pelo menos uma etapa');
      return;
    }
    
    onSubmit({
      name,
      description,
      steps
    });
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        {initialData?.id ? 'Editar Campanha' : 'Nova Campanha'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome da Campanha *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
              placeholder="Ex: Campanha de Vendas"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
              placeholder="Descreva o objetivo desta campanha"
              rows={3}
            />
          </div>
        </div>
        
        {/* Lista de etapas já adicionadas */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-2">Etapas da Campanha</h3>
          
          {steps.length > 0 ? (
            <div className="bg-gray-700 rounded-lg overflow-hidden mb-4">
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Ordem</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Estágio do Funil</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Template</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Tempo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {steps.map((step, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-white">{index + 1}</td>
                      <td className="px-4 py-2 text-sm text-orange-400">{step.stage_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-300">{step.template_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-300">{step.wait_time}</td>
                      <td className="px-4 py-2 text-sm text-gray-300">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleMoveStep(index, 'up')}
                            disabled={index === 0}
                            className={`text-gray-400 ${index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStep(index, 'down')}
                            disabled={index === steps.length - 1}
                            className={`text-gray-400 ${index === steps.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center my-4">
              Nenhuma etapa adicionada. Use o formulário abaixo para começar.
            </p>
          )}
          
          {/* Formulário para adicionar nova etapa */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-3">Adicionar Nova Etapa</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Estágio do Funil *
                </label>
                <select
                  value={newStep.stage_id}
                  onChange={(e) => setNewStep({ ...newStep, stage_id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-md border border-gray-500"
                  required
                >
                  <option value="">Selecione um estágio</option>
                  {funnelStages.map(stage => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Nome do Template *
                </label>
                <input
                  type="text"
                  value={newStep.template_name}
                  onChange={(e) => setNewStep({ ...newStep, template_name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-md border border-gray-500"
                  placeholder="Ex: qualificacao_1h"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Tempo de Espera *
                </label>
                <input
                  type="text"
                  value={newStep.wait_time}
                  onChange={(e) => setNewStep({ ...newStep, wait_time: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-md border border-gray-500"
                  placeholder="Ex: 30 minutos, 1 hora, 1 dia"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Categoria
                </label>
                <select
                  value={newStep.category || 'Utility'}
                  onChange={(e) => setNewStep({ ...newStep, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-md border border-gray-500"
                >
                  <option value="Utility">Utilitário</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Support">Suporte</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Mensagem *
                </label>
                <textarea
                  value={newStep.message}
                  onChange={(e) => setNewStep({ ...newStep, message: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-md border border-gray-500"
                  placeholder="Digite o conteúdo da mensagem..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auto-respond"
                    checked={newStep.auto_respond}
                    onChange={(e) => setNewStep({ ...newStep, auto_respond: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="auto-respond" className="text-xs text-gray-300">
                    Resposta automática
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddStep}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                Adicionar Etapa
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : (initialData?.id ? 'Atualizar' : 'Criar Campanha')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampaignForm;