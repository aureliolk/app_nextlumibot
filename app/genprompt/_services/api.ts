import prisma from '@/lib/db';

// Interface para os prompts
export interface PromptData {
  id: string;
  account_id: string;
  instruction: string;
  created_at: Date;
  prompt_created?: string;
  prompt_removed?: string;
  prompt_complete?: string;
  is_current?: boolean; // Novo campo para indicar o prompt atual
}

// Função para obter todos os prompts de uma conta
export async function getPromptsByAccountId(accountId: string): Promise<PromptData[]> {
  try {
    const prompts = await prisma.prompt.findMany({
      where: {
        account_id: accountId
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Convert null values to undefined to match PromptData type
    const typedPrompts: PromptData[] = prompts.map(prompt => ({
      ...prompt,
      prompt_created: prompt.prompt_created ?? undefined,
      prompt_removed: prompt.prompt_removed ?? undefined,
      prompt_complete: prompt.prompt_complete ?? undefined,
      is_current: prompt.is_current ?? undefined
    }));

    return typedPrompts;
  } catch (error) {
    console.error('Erro ao buscar prompts:', error);
    return [];
  }
}

// Função para obter um prompt específico
export async function getPromptById(promptId: string): Promise<PromptData | null> {
  try {
    const prompt = await prisma.prompt.findUnique({
      where: {
        id: promptId
      }
    });

    // Convert null values to undefined to match PromptData type
    if (!prompt) return null;
    
    const typedPrompt: PromptData = {
      ...prompt,
      prompt_created: prompt.prompt_created ?? undefined,
      prompt_removed: prompt.prompt_removed ?? undefined,
      prompt_complete: prompt.prompt_complete ?? undefined,
      is_current: prompt.is_current ?? undefined
    };

    return typedPrompt;
  } catch (error) {
    console.error('Erro ao buscar prompt por ID:', error);
    return null;
  }
}

// Função para salvar um novo prompt
export async function savePrompt(promptData: {
  account_id: string;
  instruction: string;
  prompt_created?: string;
  prompt_removed?: string;
  prompt_complete?: string;
}): Promise<PromptData | null> {
  try {
    const newPrompt = await prisma.prompt.create({
      data: promptData
    });

    // Convert null values to undefined to match PromptData type
    const typedPrompt: PromptData = {
      ...newPrompt,
      prompt_created: newPrompt.prompt_created ?? undefined,
      prompt_removed: newPrompt.prompt_removed ?? undefined, 
      prompt_complete: newPrompt.prompt_complete ?? undefined,
      is_current: newPrompt.is_current ?? undefined
    };

    return typedPrompt;
  } catch (error) {
    console.error('Erro ao salvar prompt:', error);
    return null;
  }
}

// Função para definir um prompt como o atual
export async function setCurrentPrompt(accountId: string, promptId: string): Promise<boolean> {
  try {
    // Primeiro, remove o status de current de todos os prompts da conta
    await prisma.prompt.updateMany({
      where: {
        account_id: accountId,
        is_current: true
      },
      data: {
        is_current: false
      }
    });

    // Depois, define o prompt específico como current
    await prisma.prompt.update({
      where: {
        id: promptId
      },
      data: {
        is_current: true
      }
    });

    return true;
  } catch (error) {
    console.error('Erro ao definir prompt atual:', error);
    return false;
  }
}

// Função para buscar apenas o prompt atual
export async function getCurrentPrompt(accountId: string): Promise<PromptData | null> {
  try {
    const currentPrompt = await prisma.prompt.findFirst({
      where: {
        account_id: accountId,
        is_current: true
      }
    });

    // Se não existir um prompt atual, retorna o mais recente
    if (!currentPrompt) {
      const latestPrompt = await prisma.prompt.findFirst({
        where: {
          account_id: accountId
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      // Se encontrou o mais recente, define-o como atual
      if (latestPrompt) {
        await setCurrentPrompt(accountId, latestPrompt.id);
        return {
          ...latestPrompt,
          prompt_created: latestPrompt.prompt_created || undefined,
          prompt_removed: latestPrompt.prompt_removed || undefined, 
          prompt_complete: latestPrompt.prompt_complete || undefined,
          is_current: latestPrompt.is_current || undefined
        };
      }
    }

    return currentPrompt ? {
      ...currentPrompt,
      prompt_created: currentPrompt.prompt_created || undefined,
      prompt_removed: currentPrompt.prompt_removed || undefined,
      prompt_complete: currentPrompt.prompt_complete || undefined, 
      is_current: currentPrompt.is_current || undefined
    } : null;
  } catch (error) {
    console.error('Erro ao buscar prompt atual:', error);
    return null;
  }
}

