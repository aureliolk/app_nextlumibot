// app/follow-up/_components/CampaignForm.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';

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

// Componente para visualização em formato de guias
interface FunnelStagesTabsProps {
  steps: Step[];
  onRemoveStep: (index: number) => void;
  onMoveStep: (index: number, direction: 'up' | 'down') => void;
}

function FunnelStagesTabs({ steps, onRemoveStep, onMoveStep }: FunnelStagesTabsProps) {
  // Agrupar os estágios por etapa do funil
  const stageGroups = useMemo(() => {
    const groups: Record<string, Step[]> = {};
    
    // Primeiro, agrupar por etapa
    steps.forEach(step => {
      const stageName = step.stage_name || 'Sem etapa definida';
      if (!groups[stageName]) {
        groups[stageName] = [];
      }
      groups[stageName].push(step);
    });
    
    // Ordenar os grupos de etapas
    return Object.entries(groups);
  }, [steps]);
  
  // Estado para controlar qual guia está ativa
  const [activeStage, setActiveStage] = useState<string>('');
  
  // Atualizar a guia ativa quando os grupos forem carregados
  useEffect(() => {
    if (stageGroups.length > 0) {
      setActiveStage(stageGroups[0][0]);
    }
  }, [stageGroups]);
  
  // Se não houver estágios, mostrar mensagem
  if (stageGroups.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        Nenhum estágio encontrado para esta campanha.
      </div>
    );
  }
  
  // Encontrar os índices originais dos passos no array de steps
  const getStepIndex = (step: Step) => {
    return steps.findIndex(s => 
      s.id === step.id && 
      s.stage_name === step.stage_name && 
      s.template_name === step.template_name
    );
  };
  
  // Calcular qual estágio está ativo
  const activeSteps = stageGroups.find(([name]) => name === activeStage)?.[1] || [];
  
  return (
    <div>
      {/* Guias de navegação horizontal */}
      <div className="flex overflow-x-auto border-b border-gray-700">
        {stageGroups.map(([stageName, stageSteps], index) => (
          <button
            key={stageName}
            onClick={() => setActiveStage(stageName)}
            className={`px-6 py-3 whitespace-nowrap ${
              activeStage === stageName
                ? 'text-orange-500 border-b-2 border-orange-500 font-medium'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {stageName} ({stageSteps.length})
          </button>
        ))}
      </div>
      
      {/* Conteúdo da guia ativa */}
      <div className="p-4">
        <h3 className="text-lg font-medium text-orange-500 mb-4">{activeStage}</h3>
        
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Ordem</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Template</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Tempo de Espera</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Mensagem</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600">
            {activeSteps.map((step, idx) => {
              const stepIndex = getStepIndex(step);
              return (
                <tr key={`${step.id || ''}-${idx}`} className="hover:bg-gray-600/30">
                  <td className="px-4 py-2 text-sm font-medium text-white">
                    {stepIndex + 1}
                  </td>
                  <td className="px-4 py-2 text-sm text-purple-400">
                    {step.template_name || 'Não definido'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-300">
                    {step.wait_time}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-300">
                    <div className="max-w-md truncate">
                      {step.message?.substring(0, 60)}
                      {step.message?.length > 60 ? '...' : ''}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => onMoveStep(stepIndex, 'up')}
                        disabled={stepIndex === 0}
                        className={`text-gray-400 ${stepIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveStep(stepIndex, 'down')}
                        disabled={stepIndex === steps.length - 1}
                        className={`text-gray-400 ${stepIndex === steps.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveStep(stepIndex)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
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
  const [steps, setSteps] = useState<Step[]>([]);
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
  
  // Inicializar os steps quando o componente for montado ou quando props mudarem
  useEffect(() => {
    // Se já temos passos nos initialData, use-os diretamente
    if (initialData?.steps && Array.isArray(initialData.steps) && initialData.steps.length > 0) {
      console.log('Usando passos fornecidos pelo componente pai:', initialData.steps.length);
      
      // Mapear os passos para o formato correto e consistente
      const formattedSteps = initialData.steps.map((step: any) => {
        // Se o formato for { stage_name, wait_time, message, template_name }
        if (step.stage_name) {
          const stage = funnelStages.find(s => s.name === step.stage_name);
          return {
            id: step.id || '',
            stage_id: step.stage_id || stage?.id || '',
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
            id: step.id || '',
            stage_id: step.stage_id || stage?.id || '',
            stage_name: step.etapa,
            template_name: step.template_name || step.nome_template || '',
            wait_time: step.wait_time || step.tempo_de_espera || '',
            message: step.message || step.mensagem || '',
            category: step.category || 'Utility',
            auto_respond: true
          };
        }
        return step as Step;
      });
      
      setSteps(formattedSteps);
    } else if (funnelStages.length > 0) {
      // Fallback: se não temos passos, criar um passo por estágio (apenas para novas campanhas)
      if (!initialData?.id) {
        console.log('Criando passos de exemplo para nova campanha');
        const defaultSteps = funnelStages.map(stage => ({
          stage_id: stage.id,
          stage_name: stage.name,
          template_name: `template_${stage.name.toLowerCase().replace(/\s+/g, '_')}`,
          wait_time: '30 minutos',
          message: `Mensagem padrão para o estágio ${stage.name}`,
          category: 'Utility',
          auto_respond: true
        }));
        setSteps(defaultSteps);
      } else {
        // Se é uma campanha existente mas sem passos, definir array vazio
        setSteps([]);
      }
    }
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
        
        {/* Lista de etapas já adicionadas - Visualização em formato de guias */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-2">Etapas da Campanha</h3>
          
          {steps.length > 0 ? (
            <div className="bg-gray-700 rounded-lg overflow-hidden mb-4">
              <FunnelStagesTabs 
                steps={steps} 
                onRemoveStep={handleRemoveStep} 
                onMoveStep={handleMoveStep}
              />
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