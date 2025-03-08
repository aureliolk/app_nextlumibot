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
  is_current?: boolean;
}

// Função para obter todos os prompts de uma conta
export async function getPromptsByAccountId(accountId: string): Promise<PromptData[]> {
  try {
    const prompts = await prisma.prompt.findMany({
      where: {
        account_id: accountId
      },
      include: {
        promptContent: true
      },
      orderBy: {
        created_at: 'desc'
      }
    }) as any;

    // Mapear os dados do modelo novo para a interface PromptData
    const typedPrompts: PromptData[] = prompts.map((prompt: { id: any; account_id: any; instruction: any; created_at: any; promptContent: { prompt_created: any; prompt_removed: any; prompt_complete: any; }; is_current: any; }) => ({
      id: prompt.id,
      account_id: prompt.account_id,
      instruction: prompt.instruction,
      created_at: prompt.created_at,
      prompt_created: prompt.promptContent?.prompt_created ?? undefined,
      prompt_removed: prompt.promptContent?.prompt_removed ?? undefined,
      prompt_complete: prompt.promptContent?.prompt_complete ?? undefined,
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
      },
      include: {
        promptContent: true
      }
    }) as any;;

    if (!prompt) return null;
    
    const typedPrompt: PromptData = {
      id: prompt.id,
      account_id: prompt.account_id,
      instruction: prompt.instruction,
      created_at: prompt.created_at,
      prompt_created: prompt.promptContent?.prompt_created ?? undefined,
      prompt_removed: prompt.promptContent?.prompt_removed ?? undefined,
      prompt_complete: prompt.promptContent?.prompt_complete ?? undefined,
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
    // Criar o prompt principal e seu conteúdo relacionado em uma única transação
    const newPrompt = await prisma.prompt.create({
      data: {
        account_id: promptData.account_id,
        instruction: promptData.instruction,
        // Criar conteúdo relacionado
        promptContent: {
          create: {
            // Mover os campos para a tabela relacionada
            prompt_created: promptData.prompt_created || null,
            prompt_removed: promptData.prompt_removed || null,
            prompt_complete: promptData.prompt_complete || null
          }
        }
      },
      include: {
        promptContent: true
      }
    }) as any;

    // Mapear para o formato PromptData
    const typedPrompt: PromptData = {
      id: newPrompt.id,
      account_id: newPrompt.account_id,
      instruction: newPrompt.instruction,
      created_at: newPrompt.created_at,
      prompt_created: newPrompt.promptContent?.prompt_created ?? undefined,
      prompt_removed: newPrompt.promptContent?.prompt_removed ?? undefined,
      prompt_complete: newPrompt.promptContent?.prompt_complete ?? undefined,
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
      },
      include: {
        promptContent: true
      }
    }) as any;

    // Se não existir um prompt atual, retorna o mais recente
    if (!currentPrompt) {
      const latestPrompt = await prisma.prompt.findFirst({
        where: {
          account_id: accountId
        },
        orderBy: {
          created_at: 'desc'
        },
        include: {
          promptContent: true
        }
      }) as any;

      // Se encontrou o mais recente, define-o como atual
      if (latestPrompt) {
        await setCurrentPrompt(accountId, latestPrompt.id);
        return {
          id: latestPrompt.id,
          account_id: latestPrompt.account_id,
          instruction: latestPrompt.instruction,
          created_at: latestPrompt.created_at,
          prompt_created: latestPrompt.promptContent?.prompt_created ?? undefined,
          prompt_removed: latestPrompt.promptContent?.prompt_removed ?? undefined,
          prompt_complete: latestPrompt.promptContent?.prompt_complete ?? undefined,
          is_current: true // Definimos como true já que acabamos de torná-lo o prompt atual
        };
      }
    }

    if (!currentPrompt) return null;
    
    return {
      id: currentPrompt.id,
      account_id: currentPrompt.account_id,
      instruction: currentPrompt.instruction,
      created_at: currentPrompt.created_at,
      prompt_created: currentPrompt.promptContent?.prompt_created ?? undefined,
      prompt_removed: currentPrompt.promptContent?.prompt_removed ?? undefined,
      prompt_complete: currentPrompt.promptContent?.prompt_complete ?? undefined,
      is_current: currentPrompt.is_current ?? undefined
    };
  } catch (error) {
    console.error('Erro ao buscar prompt atual:', error);
    return null;
  }
}