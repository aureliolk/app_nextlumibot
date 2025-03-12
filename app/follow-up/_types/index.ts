// app/follow-up/_types/index.ts

export interface FollowUpMessage {
    id: string;
    follow_up_id: string;
    step: number;
    content: string;
    sent_at: string;
    delivered: boolean;
    delivered_at: string | null;
  }
  
  export interface FollowUp {
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
  
  export interface Campaign {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    active: boolean;
    stepsCount: number;
    activeFollowUps: number;
  }
  
  export interface CampaignStep {
    etapa: string;
    mensagem: string;
    tempo_de_espera: string;
    condicionais?: string;
  }