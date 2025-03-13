// app/follow-up/kanban/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  SearchBar,
  KanbanBoard,
  FollowUpDetailModal,
  Footer,
  ErrorMessage
} from '../_components';
import MainNavigation from '../_components/MainNavigation';
import { FollowUp } from '../_components/FollowUpTable';

export default function KanbanPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);

  // Carregar follow-ups e estágios do funil
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Buscar estágios do funil
        const stagesResponse = await axios.get('/api/follow-up/funnel-stages');
        if (stagesResponse.data.success) {
          setStages(stagesResponse.data.data);
        }

        // Buscar follow-ups
        const followUpsResponse = await axios.get('/api/follow-up', {
          params: { status: 'active' }
        });
        if (followUpsResponse.data.success) {
          setFollowUps(followUpsResponse.data.data);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // We don't need to fetch campaign steps anymore - the component will handle this

  // Filtrar follow-ups por termo de busca
  const filteredFollowUps = followUps.filter(followUp => {
    if (!searchTerm) return true;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // Buscar no ID do cliente
    if (followUp.client_id.toLowerCase().includes(lowerSearchTerm)) return true;
    
    // Buscar no nome da campanha
    if (followUp.campaign.name.toLowerCase().includes(lowerSearchTerm)) return true;
    
    // Buscar no estágio atual
    if (followUp.current_stage_name?.toLowerCase().includes(lowerSearchTerm)) return true;
    
    // Buscar em metadados (se existirem)
    if (followUp.metadata) {
      const metadata = typeof followUp.metadata === 'string' 
        ? JSON.parse(followUp.metadata) 
        : followUp.metadata;
      
      if (metadata.name?.toLowerCase().includes(lowerSearchTerm)) return true;
      if (metadata.email?.toLowerCase().includes(lowerSearchTerm)) return true;
      if (metadata.phone?.toLowerCase().includes(lowerSearchTerm)) return true;
    }
    
    return false;
  });

  // Função para mover um cliente para outra etapa do funil
  const handleMoveClient = async (followUpId: string, targetStageId: string) => {
    try {
      // Chamada à API para atualizar a etapa do cliente
      const response = await axios.put(`/api/follow-up/${followUpId}/move-stage`, {
        stageId: targetStageId
      });
      
      if (response.data.success) {
        // Atualizar a lista local após o sucesso da API
        setFollowUps(prevFollowUps => 
          prevFollowUps.map(followUp => 
            followUp.id === followUpId 
              ? { 
                ...followUp, 
                current_stage_id: targetStageId,
                current_stage_name: stages.find(s => s.id === targetStageId)?.name || followUp.current_stage_name
              } 
              : followUp
          )
        );
      }
    } catch (err) {
      console.error('Erro ao mover cliente:', err);
      setError('Erro ao mover cliente para outra etapa.');
    }
  };

  // Função para cancelar um follow-up
  const handleCancelFollowUp = async (id: string) => {
    try {
      const response = await axios.post(`/api/follow-up/cancel`, { id });
      
      if (response.data.success) {
        // Atualizar a lista local após o sucesso da API
        setFollowUps(prevFollowUps => 
          prevFollowUps.map(followUp => 
            followUp.id === id 
              ? { ...followUp, status: 'canceled' } 
              : followUp
          )
        );
        
        // Fechar o modal se o cliente cancelado estiver selecionado
        if (selectedFollowUp?.id === id) {
          setSelectedFollowUp(null);
        }
      }
    } catch (err) {
      console.error('Erro ao cancelar follow-up:', err);
      setError('Erro ao cancelar follow-up.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <MainNavigation />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Visualização do Funil</h1>
          
          <div className="flex justify-between items-center mb-4">
            <SearchBar 
              value={searchTerm} 
              onChange={setSearchTerm} 
              placeholder="Buscar por cliente, campanha ou etapa..." 
            />
          </div>
          
          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
          
          <KanbanBoard 
            stages={stages} 
            followUps={filteredFollowUps} 
            isLoading={isLoading} 
            onMoveClient={handleMoveClient} 
            onClientSelect={setSelectedFollowUp} 
          />
        </div>
      </main>
      
      <Footer />
      
      {selectedFollowUp && (
        <FollowUpDetailModal 
          followUp={selectedFollowUp} 
          onClose={() => setSelectedFollowUp(null)} 
          onCancel={handleCancelFollowUp} 
        />
      )}
    </div>
  );
}