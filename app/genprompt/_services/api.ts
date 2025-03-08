import prisma from '@/lib/db';

// Interface para os prompts
export interface PromptData {
  id: string;
  account_id: string;
  prompt: string;
  created_at: Date;
  analysis?: string;
  prompt_created?: string;
  prompt_removed?: string;
  prompt_complete?: string;
  quality_checks?: any;
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
    
    return prompts;
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
    
    return prompt;
  } catch (error) {
    console.error('Erro ao buscar prompt por ID:', error);
    return null;
  }
}

// Função para salvar um novo prompt
export async function savePrompt(promptData: {
  account_id: string;
  prompt: string;
  analysis?: string;
  prompt_created?: string;
  prompt_removed?: string;
  prompt_complete?: string;
  quality_checks?: any;
}): Promise<PromptData | null> {
  try {
    const newPrompt = await prisma.prompt.create({
      data: promptData
    });
    
    return newPrompt;
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
        return latestPrompt;
      }
    }
    
    return currentPrompt;
  } catch (error) {
    console.error('Erro ao buscar prompt atual:', error);
    return null;
  }
}

// Função corrigida para processar a resposta da API e extrair as seções
export function processApiResponse(response: string): {
  analysis: string;
  prompt_created: string;
  prompt_removed: string;
  prompt_complete: string;
  quality_checks: string[];
} {
  console.log('Processando resposta bruta:', response.substring(0, 100) + '...');
  
  try {
    const sections = response.split('---').filter(section => section.trim());
    console.log(`Encontradas ${sections.length} seções na resposta`);
    
    let analysis = '';
    let prompt_created = '';
    let prompt_removed = '';
    let prompt_complete = '';
    let quality_checks: string[] = [];
    
    for (const section of sections) {
      // Log de debug para identificar o tipo de seção
      const firstLine = section.split('\n')[0].trim();
      console.log('Processando seção:', firstLine);
      
      // Para análise
      if (section.includes('## ANÁLISE:')) {
        analysis = section.trim();
        console.log('Análise encontrada');
      } 
      // Para prompt criado
      else if (section.toLowerCase().includes('parte do prompt que vai ser criada ou alterada')) {
        // Procurar por qualquer tipo de bloco de código (plaintext, markdown, etc)
        const codeBlockMatch = section.match(/```(?:plaintext|markdown)?\s+([\s\S]*?)\s+```/);
        
        if (codeBlockMatch && codeBlockMatch[1]) {
          // Se encontrou o bloco de código, use apenas o conteúdo dentro dele
          prompt_created = codeBlockMatch[1].trim();
          console.log('Prompt criado extraído do bloco de código');
        } else {
          // Se não encontrou o bloco, extrair o conteúdo após o título
          const contentAfterTitle = section.split(/parte do prompt que vai ser criada ou alterada:?/i)[1];
          if (contentAfterTitle) {
            prompt_created = contentAfterTitle.trim();
            console.log('Prompt criado extraído após o título');
          } else {
            // Último recurso: usar a seção inteira
            prompt_created = section.trim();
            console.log('Prompt criado usando seção inteira');
          }
        }
      } 
      // Para prompt removido
      else if (section.toLowerCase().includes('parte do prompt que foi removida')) {
        // Procurar por qualquer tipo de bloco de código
        const codeBlockMatch = section.match(/```(?:plaintext|markdown)?\s+([\s\S]*?)\s+```/);
        
        if (codeBlockMatch && codeBlockMatch[1]) {
          prompt_removed = codeBlockMatch[1].trim();
          console.log('Prompt removido extraído do bloco de código');
        } else {
          // Se não encontrou o bloco, extrair o conteúdo após o título
          const contentAfterTitle = section.split(/parte do prompt que foi removida.*?:/i)[1];
          if (contentAfterTitle) {
            prompt_removed = contentAfterTitle.trim();
            console.log('Prompt removido extraído após o título');
          } else {
            prompt_removed = section.trim();
            console.log('Prompt removido usando seção inteira');
          }
        }
      } 
      // Para prompt completo
      else if (section.toLowerCase().includes('prompt completo atualizado')) {
        // Procurar por qualquer tipo de bloco de código
        const codeBlockMatch = section.match(/```(?:plaintext|markdown)?\s+([\s\S]*?)\s+```/);
        
        if (codeBlockMatch && codeBlockMatch[1]) {
          prompt_complete = codeBlockMatch[1].trim();
          console.log('Prompt completo extraído do bloco de código');
        } else {
          // Se não encontrou o bloco, extrair o conteúdo após o título
          const contentAfterTitle = section.split(/prompt completo atualizado.*?:/i)[1];
          if (contentAfterTitle) {
            prompt_complete = contentAfterTitle.trim();
            console.log('Prompt completo extraído após o título');
          } else {
            prompt_complete = section.trim();
            console.log('Prompt completo usando seção inteira');
          }
        }
      } 
      // Para checklist de qualidade
      else if (section.includes('## Checklist de Qualidade')) {
        const checklistLines = section.split('\n')
          .filter(line => line.includes('- [x]'))
          .map(line => line.replace('- [x]', '').trim());
        quality_checks = checklistLines;
        console.log(`Checklist de qualidade encontrado com ${checklistLines.length} itens`);
      }
    }
    
    // Verificar formato da resposta JSON
    try {
      const jsonResponse = JSON.parse(response);
      if (jsonResponse.response) {
        // Se a resposta for um objeto JSON com uma propriedade "response"
        return processApiResponse(jsonResponse.response);
      }
    } catch (e) {
      // Não é um JSON, continua com o processamento normal
    }
    
    // Verificar se o prompt_complete está vazio, mas há prompt_created
    if (!prompt_complete && prompt_created) {
      console.log('Prompt completo vazio mas prompt criado encontrado - usando prompt criado');
      prompt_complete = prompt_created;
    }
    
    return {
      analysis,
      prompt_created,
      prompt_removed,
      prompt_complete,
      quality_checks
    };
  } catch (error) {
    console.error('Erro ao processar resposta da API:', error);
    // Em caso de erro, tentar extrair o conteúdo bruto entre blocos de código
    try {
      const codeBlockMatch = response.match(/```(?:plaintext|markdown)?\s+([\s\S]*?)\s+```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        return {
          analysis: '',
          prompt_created: '',
          prompt_removed: '',
          prompt_complete: codeBlockMatch[1].trim(),
          quality_checks: []
        };
      }
    } catch (e) {
      console.error('Também falhou ao extrair código bruto:', e);
    }
    
    // Último recurso: retornar a resposta bruta como prompt_complete
    return {
      analysis: '',
      prompt_created: '',
      prompt_removed: '',
      prompt_complete: response,
      quality_checks: []
    };
  }
}

// Função auxiliar para testar o processamento com a resposta da API
export function testProcessApiResponse(response: string) {
  const result = processApiResponse(response);
  console.log('=== RESULTADO DO PROCESSAMENTO ===');
  console.log('Análise encontrada:', result.analysis ? 'Sim' : 'Não');
  console.log('Prompt criado encontrado:', result.prompt_created ? 'Sim' : 'Não');
  console.log('Prompt removido encontrado:', result.prompt_removed ? 'Sim' : 'Não');
  console.log('Prompt completo encontrado:', result.prompt_complete ? 'Sim' : 'Não');
  console.log('Quantidade de itens na checklist:', result.quality_checks.length);
  
  // Tamanho de cada seção
  console.log('Tamanho da análise:', result.analysis.length);
  console.log('Tamanho do prompt criado:', result.prompt_created.length);
  console.log('Tamanho do prompt removido:', result.prompt_removed.length);
  console.log('Tamanho do prompt completo:', result.prompt_complete.length);
  
  return result;
}